import { aiPipelineService, AiPipelineService } from '../ai/services/ai-pipeline.service';
import { AiPipelineResult } from '../ai/interfaces/ai-pipeline.interface';
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
  ): Promise<AiPipelineResult> {
    logger.info('Pending review workflow started for WhatsApp message', {
      groupName: message.groupName,
      sender: message.sender,
    });

    try {
      const result = await this.aiPipeline.processWhatsAppMessage(message);

      logger.info('Pending review workflow created pending record from WhatsApp message', {
        pendingRecordId: result.pendingRecord._id,
        category: result.recordCategory,
        status: result.pendingStatus,
        confidenceScore: result.confidenceScore,
      });

      return result;
    } catch (error) {
      logger.warn('AI pipeline failed; saving raw WhatsApp message for manual review', {
        groupName: message.groupName,
        sender: message.sender,
        error: error instanceof Error ? error.message : String(error),
      });

      const pendingRecord = await pendingReviewService.createPendingRecord({
        originalMessage: message.message,
        groupName: message.groupName,
        senderName: message.sender,
        category: 'Research',
        extractedData: {
          message: message.message,
          media: message.media,
          mediaMetadata: message.mediaMetadata ?? null,
          aiProcessingFailed: true,
          aiProcessingError: error instanceof Error ? error.message : String(error),
        },
        confidenceScore: 0,
        status: 'Needs Review',
      });

      logger.info('Pending review workflow saved raw WhatsApp message after AI failure', {
        pendingRecordId: pendingRecord._id,
      });

      return {
        pendingRecord,
        stages: {} as AiPipelineResult['stages'],
        recordCategory: 'Research',
        pendingStatus: 'Needs Review',
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

  async getPendingRecord(id: string): Promise<IPendingRecordResponse> {
    return pendingReviewService.getPendingRecordById(id);
  }
}

export const pendingReviewWorkflowService = new PendingReviewWorkflowService();
