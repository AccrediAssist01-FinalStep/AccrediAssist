import { aiPipelineService, AiPipelineService } from '../ai/services/ai-pipeline.service';
import { newsDetectionAgent } from '../ai/agents/news-detection.agent';
import { newsPipelineService } from '../ai/services/news-pipeline.service';
import { eventCorrelationService } from './event-correlation.service';
import {
  isInstitutionalImageType,
  shouldIgnoreRejectedImage,
} from '../ai/utils/news-detection-result.util';
import { isImageMessage, shouldRunNewsDetectionForImage } from '../ai/utils/media-detection.util';
import { AiPipelineResult } from '../ai/interfaces/ai-pipeline.interface';
import {
  getMessageValidationReason,
  isNonInstitutionalMessage,
} from '../ai/utils/message-validation.util';
import { logPipelineStage, PIPELINE_STAGES } from '../ai/utils/pipeline-stage-logger.util';
import { pendingRecordAutoReviewService } from './pendingRecordAutoReview.service';
import { pendingRecordApprovalService } from './pendingRecordApproval.service';
import { pendingRecordEditService } from './pendingRecordEdit.service';
import { pendingRecordRejectionService } from './pendingRecordRejection.service';
import { pendingReviewService } from './pendingReview.service';
import {
  EditPendingRecordInput,
  IPendingRecordResponse,
  RejectPendingRecordInput,
} from '../types/pendingRecord.types';
import { messageListener } from '../whatsapp/message.listener';
import { resolveIncomingMessageText } from '../whatsapp/message-text.util';
import { WhatsAppIncomingMessage } from '../whatsapp/types';
import { logger } from '../utils/logger';

export class PendingReviewWorkflowService {
  private whatsAppHandlerRegistered = false;

  constructor(private readonly aiPipeline: AiPipelineService = aiPipelineService) {}

  registerWhatsAppMessageHandler(): void {
    if (this.whatsAppHandlerRegistered) {
      return;
    }

    messageListener.setMessageHandler(async (message) => {
      await this.processIncomingWhatsAppMessage(message);
    });

    this.whatsAppHandlerRegistered = true;
    logger.info('Pending review workflow connected to WhatsApp message listener');
  }

  async processIncomingWhatsAppMessage(
    message: WhatsAppIncomingMessage,
  ): Promise<AiPipelineResult | null> {
    if (message.whatsappMessageId) {
      const existingByMessageId = await pendingReviewService.findByWhatsAppMessageId(
        message.whatsappMessageId,
      );
      if (existingByMessageId) {
        logger.info('Skipping duplicate WhatsApp delivery; pending record already exists', {
          pendingRecordId: existingByMessageId._id,
          whatsappMessageId: message.whatsappMessageId,
        });
        return null;
      }
    }

    logPipelineStage(PIPELINE_STAGES.MESSAGE_RECEIVED, {
      groupName: message.groupName,
      sender: message.sender,
      hasMedia: Boolean(message.media),
    });

    const hasCollectingSession = await eventCorrelationService.hasCollectingSession(
      message.groupName,
    );

    if (hasCollectingSession) {
      const appendedToEventSession = await eventCorrelationService.handleMessage(message);
      if (appendedToEventSession) {
        logPipelineStage(PIPELINE_STAGES.MESSAGE_VALIDATION, {
          ignored: false,
          routing: 'ai-event-report-session',
          appended: true,
          groupName: message.groupName,
        });
        return null;
      }
    }

    const validationReason = getMessageValidationReason(message);
    if (isNonInstitutionalMessage(message)) {
      logPipelineStage(PIPELINE_STAGES.MESSAGE_VALIDATION, {
        ignored: true,
        reason: validationReason,
        messagePreview: message.message.slice(0, 80),
      });
      return null;
    }

    logPipelineStage(PIPELINE_STAGES.MESSAGE_VALIDATION, {
      ignored: false,
      hasMedia: Boolean(message.media),
      hasText: Boolean(message.message.trim()),
    });

    if (isImageMessage(message) && shouldRunNewsDetectionForImage(message)) {
      const newsResponse = await newsDetectionAgent.analyze(message);

      if (newsResponse) {
        logPipelineStage(PIPELINE_STAGES.GEMINI_RESPONSE, {
          stage: 'news-detection',
          model: newsResponse.model,
          isNewspaperArticle: newsResponse.result.isNewspaperArticle,
          confidence: newsResponse.result.confidence,
        });

        if (shouldIgnoreRejectedImage(newsResponse.result)) {
          logPipelineStage(PIPELINE_STAGES.MESSAGE_VALIDATION, {
            ignored: true,
            reason: `casual image (${newsResponse.result.rejectedImageType})`,
          });
          return null;
        }

        if (
          !newsResponse.result.isNewspaperArticle &&
          isInstitutionalImageType(newsResponse.result.rejectedImageType)
        ) {
          logPipelineStage(PIPELINE_STAGES.MESSAGE_VALIDATION, {
            ignored: false,
            reason: `non-newspaper institutional image (${newsResponse.result.rejectedImageType})`,
            routing: 'standard-pipeline',
          });
        } else if (!newsResponse.result.isNewspaperArticle) {
          logPipelineStage(PIPELINE_STAGES.MESSAGE_VALIDATION, {
            ignored: false,
            reason: 'non-newspaper image without institutional type',
            routing: 'standard-pipeline',
          });
        }

        if (newsResponse.result.isNewspaperArticle) {
          const result = await newsPipelineService.processNewsMessage(
            message,
            newsResponse.result,
          );

          const autoReview = await pendingRecordAutoReviewService.resolveByConfidence(
            result.pendingRecord._id,
            result.confidenceScore,
          );

          logger.info('Pending review workflow auto-resolved WhatsApp news message', {
            pendingRecordId: autoReview.record._id,
            category: 'News',
            action: autoReview.action,
            status: autoReview.record.status,
            confidenceScore: result.confidenceScore,
          });

          return {
            ...result,
            pendingRecord: autoReview.record,
            pendingStatus: autoReview.record.status,
          };
        }
      }
    }

    const routedToEventSession = await eventCorrelationService.handleMessage(message);
    if (routedToEventSession) {
      logPipelineStage(PIPELINE_STAGES.MESSAGE_VALIDATION, {
        ignored: false,
        routing: 'ai-event-report-session',
        groupName: message.groupName,
      });
      return null;
    }

    try {
      const result = await this.aiPipeline.processWhatsAppMessage(message);

      const autoReview = await pendingRecordAutoReviewService.resolveByConfidence(
        result.pendingRecord._id,
        result.confidenceScore,
      );

      logger.info('Pending review workflow auto-resolved WhatsApp message', {
        pendingRecordId: autoReview.record._id,
        category: result.recordCategory,
        detectedCategory: result.stages.classification.result.category,
        action: autoReview.action,
        status: autoReview.record.status,
        confidenceScore: result.confidenceScore,
        threshold: autoReview.threshold,
      });

      return {
        ...result,
        pendingRecord: autoReview.record,
        pendingStatus: autoReview.record.status,
      };
    } catch (error) {
      logger.warn('AI pipeline failed; saving raw WhatsApp message for manual review', {
        groupName: message.groupName,
        sender: message.sender,
        error: error instanceof Error ? error.message : String(error),
      });

      const fallbackMessage = resolveIncomingMessageText({
        message: message.message,
        media: message.media,
        mediaMetadata: message.mediaMetadata,
        sender: message.sender,
      });

      const isPdf = message.mediaMetadata?.mediaType === 'pdf';
      const isImage = isImageMessage(message);

      const pendingRecord = await pendingReviewService.createPendingRecord({
        originalMessage: fallbackMessage,
        groupName: message.groupName,
        senderName: message.sender,
        whatsappMessageId: message.whatsappMessageId,
        category: isImage ? 'News' : 'Research',
        extractedData: {
          message: fallbackMessage,
          media: message.media,
          mediaMetadata: message.mediaMetadata ?? null,
          aiProcessingFailed: true,
          aiProcessingError: error instanceof Error ? error.message : String(error),
        },
        confidenceScore: 0,
        status: isPdf || isImage ? 'Needs Review' : 'Pending',
      });

      if (isPdf || isImage) {
        logPipelineStage(PIPELINE_STAGES.PENDING_REVIEW_CREATION, {
          pendingRecordId: pendingRecord._id,
          fallback: true,
          status: pendingRecord.status,
          reason: isPdf
            ? 'PDF processing failed; kept for manual review'
            : 'Image processing failed; kept for manual review',
        });

        return {
          pendingRecord,
          stages: {} as AiPipelineResult['stages'],
          recordCategory: isImage ? 'News' : 'Research',
          pendingStatus: pendingRecord.status,
          confidenceScore: 0,
        };
      }

      const autoReview = await pendingRecordAutoReviewService.resolveByConfidence(
        pendingRecord._id,
        0,
      );

      logPipelineStage(PIPELINE_STAGES.PENDING_REVIEW_CREATION, {
        pendingRecordId: pendingRecord._id,
        fallback: true,
        autoReview: autoReview.action,
        status: autoReview.record.status,
      });

      return {
        pendingRecord: autoReview.record,
        stages: {} as AiPipelineResult['stages'],
        recordCategory: 'Research',
        pendingStatus: autoReview.record.status,
        confidenceScore: 0,
      };
    }
  }

  async editPendingRecord(
    id: string,
    userId: string,
    input: EditPendingRecordInput,
  ): Promise<IPendingRecordResponse> {
    return pendingRecordEditService.editPendingRecord(id, userId, input);
  }

  async approvePendingRecord(id: string, userId: string): Promise<IPendingRecordResponse> {
    return pendingRecordApprovalService.approvePendingRecord(id, userId);
  }

  async rejectPendingRecord(
    id: string,
    userId: string,
    input: RejectPendingRecordInput,
  ): Promise<IPendingRecordResponse> {
    return pendingRecordRejectionService.rejectPendingRecord(id, userId, input);
  }

  async regenerateAiEventReport(id: string): Promise<IPendingRecordResponse> {
    const { pendingRecordRegenerateService } = await import('./pendingRecordRegenerate.service');
    return pendingRecordRegenerateService.regenerateAiEventReport(id);
  }

  async getPendingRecord(id: string): Promise<IPendingRecordResponse> {
    return pendingReviewService.getPendingRecordById(id);
  }
}

export const pendingReviewWorkflowService = new PendingReviewWorkflowService();
