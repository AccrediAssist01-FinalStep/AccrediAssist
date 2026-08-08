import { pendingReviewService, PendingReviewService } from '../../services/pendingReview.service';
import { WhatsAppIncomingMessage } from '../../whatsapp/types';
import { resolveIncomingMessageText } from '../../whatsapp/message-text.util';
import { ClassificationAgent, classificationAgent } from '../agents/classification.agent';
import { DuplicateDetectionAgent, duplicateDetectionAgent } from '../agents/duplicate-detection.agent';
import { ExtractionAgent, extractionAgent } from '../agents/extraction.agent';
import { PdfDocumentAgent, pdfDocumentAgent } from '../agents/pdf-document.agent';
import { ValidationAgent, validationAgent } from '../agents/validation.agent';
import { AiPipelineResult, AiPipelineStageResults } from '../interfaces/ai-pipeline.interface';
import { ExtractionResult } from '../interfaces/extraction.interface';
import { resolveActivityClassification } from '../utils/activity-module.util';
import { enrichExtractionAchievementType } from '../utils/achievement-inference.util';
import { enrichExtractionFields } from '../utils/extraction-enrichment.util';
import { correctClassificationForExtraction } from '../utils/classification-correction.util';
import { mapClassificationToRecordCategory } from '../utils/category-mapper.util';
import { isPdfMessage } from '../utils/media-detection.util';
import {
  buildPdfPendingExtractedData,
  mapPdfCategoryToRecordCategory,
  mergePdfExtractionIntoResult,
} from '../utils/pdf-document-mapper.util';
import {
  calculatePipelineConfidenceScore,
  resolvePendingRecordStatus,
} from '../utils/pipeline-status.util';
import { logPipelineStage, PIPELINE_STAGES } from '../utils/pipeline-stage-logger.util';
import { logger } from '../../utils/logger';
import {
  buildPendingMessageMediaFields,
  mergePendingMediaReferences,
} from '../../utils/pending-record-media.util';
import { normalizeExtractedPersonFields } from '../../utils/extractedPersonFields.util';

const buildPendingExtractedData = (
  message: WhatsAppIncomingMessage,
  extraction: ExtractionResult,
  stages: AiPipelineStageResults,
  detectedCategory: string,
  activityModule: string,
  activitySubCategory: string,
  pdfData?: Record<string, unknown>,
): Record<string, unknown> => {
  const messageMedia = buildPendingMessageMediaFields(message);

  return normalizeExtractedPersonFields({
    ...extraction,
    ...pdfData,
    media: messageMedia.media ?? message.media,
    photoUrls: messageMedia.photoUrls.length > 0 ? messageMedia.photoUrls : undefined,
    mediaReferences: mergePendingMediaReferences(
      extraction.mediaReferences,
      messageMedia.mediaReferences,
    ),
    mediaMetadata: message.mediaMetadata ?? null,
    detectedCategory,
    activityModule,
    activitySubCategory,
    aiPipeline: {
      classification: stages.classification.result,
      validation: stages.validation.result,
      duplicateDetection: stages.duplicateDetection.result,
      pdfDocument: pdfData ?? null,
      models: {
        extraction: stages.extraction.model,
        classification: stages.classification.model,
        validation: stages.validation.model,
      },
    },
  });
};

export class AiPipelineService {
  constructor(
    private readonly extraction: ExtractionAgent = extractionAgent,
    private readonly pdfDocument: PdfDocumentAgent = pdfDocumentAgent,
    private readonly classification: ClassificationAgent = classificationAgent,
    private readonly validation: ValidationAgent = validationAgent,
    private readonly duplicateDetection: DuplicateDetectionAgent = duplicateDetectionAgent,
    private readonly pendingReview: PendingReviewService = pendingReviewService,
  ) {}

  async processWhatsAppMessage(message: WhatsAppIncomingMessage): Promise<AiPipelineResult> {
    const originalMessage = resolveIncomingMessageText({
      message: message.message,
      media: message.media,
      mediaMetadata: message.mediaMetadata,
      sender: message.sender,
    });

    logPipelineStage(PIPELINE_STAGES.MESSAGE_RECEIVED, {
      groupName: message.groupName,
      sender: message.sender,
      hasMedia: Boolean(message.media),
      messagePreview: originalMessage.slice(0, 120),
    });

    let pdfResponse = null;
    if (isPdfMessage(message)) {
      try {
        pdfResponse = await this.pdfDocument.extract(message);
      } catch (error) {
        logger.warn('PDF document extraction failed; continuing with standard extraction', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (pdfResponse) {
      logPipelineStage(PIPELINE_STAGES.GEMINI_RESPONSE, {
        stage: 'pdf-document',
        model: pdfResponse.model,
        documentType: pdfResponse.result.documentType,
        confidence: pdfResponse.result.confidence,
      });
    }

    const extractionResponse = await this.extraction.extract(message);
    let extractedData = enrichExtractionFields(
      enrichExtractionAchievementType(extractionResponse.result),
      originalMessage,
    );

    if (pdfResponse) {
      extractedData = mergePdfExtractionIntoResult(extractedData, pdfResponse.result);
      extractedData = enrichExtractionAchievementType(extractedData);
    }

    logPipelineStage(PIPELINE_STAGES.GEMINI_RESPONSE, {
      stage: 'extraction',
      model: extractionResponse.model,
      confidence: extractedData.confidence,
    });

    const classificationResponse = await this.classification.classify({
      extractedData,
      originalMessage,
    });

    const correctedClassification = correctClassificationForExtraction(
      classificationResponse.result,
      extractedData,
      originalMessage,
    );

    logPipelineStage(PIPELINE_STAGES.CLASSIFICATION, {
      category: correctedClassification.category,
      confidence: correctedClassification.confidence,
      model: classificationResponse.model,
      corrected: correctedClassification.category !== classificationResponse.result.category,
    });

    const validationResponse = await this.validation.validate({
      category: correctedClassification.category,
      extractedData,
      originalMessage,
    });

    let recordCategory = mapClassificationToRecordCategory(
      correctedClassification.category,
      extractedData,
    );

    if (pdfResponse && (pdfResponse.result.confidence ?? 0) >= 60) {
      recordCategory = mapPdfCategoryToRecordCategory(pdfResponse.result);
    }

    const duplicateDetectionResponse = await this.duplicateDetection.detect({
      category: recordCategory,
      extractedData,
    });

    const confidenceScore = calculatePipelineConfidenceScore(
      extractedData,
      correctedClassification,
      validationResponse.result,
    );

    const pendingStatus = resolvePendingRecordStatus({
      validation: validationResponse.result,
      duplicateDetection: duplicateDetectionResponse.result,
      confidenceScore,
    });

    const activity = resolveActivityClassification(recordCategory, extractedData, originalMessage);
    const pdfData = pdfResponse
      ? buildPdfPendingExtractedData(
          pdfResponse.result,
          message.media ?? message.mediaMetadata?.secureUrl ?? null,
        )
      : undefined;

    const stages: AiPipelineStageResults = {
      extraction: extractionResponse,
      classification: {
        ...classificationResponse,
        result: correctedClassification,
      },
      validation: validationResponse,
      duplicateDetection: duplicateDetectionResponse,
    };

    const existingPending =
      (message.whatsappMessageId
        ? await this.pendingReview.findByWhatsAppMessageId(message.whatsappMessageId)
        : null) ??
      (await this.pendingReview.findActiveDuplicateByMessage(originalMessage));
    if (existingPending) {
      logger.info('Skipping duplicate pending record for repeated WhatsApp message', {
        pendingRecordId: existingPending._id,
        whatsappMessageId: message.whatsappMessageId ?? null,
      });

      return {
        pendingRecord: existingPending,
        stages,
        recordCategory,
        pendingStatus: existingPending.status,
        confidenceScore: existingPending.confidenceScore,
      };
    }

    const pendingRecord = await this.pendingReview.createPendingRecord({
      originalMessage,
      groupName: message.groupName,
      senderName: message.sender,
      whatsappMessageId: message.whatsappMessageId,
      category: recordCategory,
      extractedData: buildPendingExtractedData(
        message,
        extractedData,
        stages,
        correctedClassification.category,
        activity.module,
        activity.subCategory,
        pdfData,
      ),
      confidenceScore,
      status: pendingStatus,
    });

    logPipelineStage(PIPELINE_STAGES.PENDING_REVIEW_CREATION, {
      pendingRecordId: pendingRecord._id,
      recordCategory,
      detectedCategory: correctedClassification.category,
      status: pendingStatus,
      confidenceScore,
      duplicate: duplicateDetectionResponse.result.duplicate,
    });

    return {
      pendingRecord,
      stages,
      recordCategory,
      pendingStatus,
      confidenceScore,
    };
  }
}

export const aiPipelineService = new AiPipelineService();
