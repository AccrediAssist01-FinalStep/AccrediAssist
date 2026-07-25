import { pendingReviewService, PendingReviewService } from '../../services/pendingReview.service';
import { logger } from '../../utils/logger';
import { WhatsAppIncomingMessage } from '../../whatsapp/types';
import { ClassificationAgent, classificationAgent } from '../agents/classification.agent';
import { DuplicateDetectionAgent, duplicateDetectionAgent } from '../agents/duplicate-detection.agent';
import { ExtractionAgent, extractionAgent } from '../agents/extraction.agent';
import { ValidationAgent, validationAgent } from '../agents/validation.agent';
import { AiPipelineResult, AiPipelineStageResults } from '../interfaces/ai-pipeline.interface';
import { ExtractionResult } from '../interfaces/extraction.interface';
import { mapClassificationToRecordCategory } from '../utils/category-mapper.util';
import {
  calculatePipelineConfidenceScore,
  resolvePendingRecordStatus,
} from '../utils/pipeline-status.util';

const buildPendingExtractedData = (
  message: WhatsAppIncomingMessage,
  extraction: ExtractionResult,
  stages: AiPipelineStageResults,
): Record<string, unknown> => ({
  ...extraction,
  media: message.media,
  mediaMetadata: message.mediaMetadata ?? null,
  aiPipeline: {
    classification: stages.classification.result,
    validation: stages.validation.result,
    duplicateDetection: stages.duplicateDetection.result,
    models: {
      extraction: stages.extraction.model,
      classification: stages.classification.model,
      validation: stages.validation.model,
    },
  },
});

export class AiPipelineService {
  constructor(
    private readonly extraction: ExtractionAgent = extractionAgent,
    private readonly classification: ClassificationAgent = classificationAgent,
    private readonly validation: ValidationAgent = validationAgent,
    private readonly duplicateDetection: DuplicateDetectionAgent = duplicateDetectionAgent,
    private readonly pendingReview: PendingReviewService = pendingReviewService,
  ) {}

  async processWhatsAppMessage(message: WhatsAppIncomingMessage): Promise<AiPipelineResult> {
    logger.info('AI pipeline started for WhatsApp message', {
      groupName: message.groupName,
      sender: message.sender,
    });

    const extractionResponse = await this.extraction.extract(message);
    const extractedData = extractionResponse.result;

    const classificationResponse = await this.classification.classify({
      extractedData,
      originalMessage: message.message,
    });

    const validationResponse = await this.validation.validate({
      category: classificationResponse.result.category,
      extractedData,
      originalMessage: message.message,
    });

    const duplicateDetectionResponse = await this.duplicateDetection.detect({
      category: classificationResponse.result.category,
      extractedData,
    });

    const confidenceScore = calculatePipelineConfidenceScore(
      extractedData,
      classificationResponse.result,
    );

    const pendingStatus = resolvePendingRecordStatus({
      validation: validationResponse.result,
      duplicateDetection: duplicateDetectionResponse.result,
      confidenceScore,
    });

    const recordCategory = mapClassificationToRecordCategory(
      classificationResponse.result.category,
      extractedData,
    );

    const stages: AiPipelineStageResults = {
      extraction: extractionResponse,
      classification: classificationResponse,
      validation: validationResponse,
      duplicateDetection: duplicateDetectionResponse,
    };

    const pendingRecord = await this.pendingReview.createPendingRecord({
      originalMessage: message.message,
      groupName: message.groupName,
      senderName: message.sender,
      category: recordCategory,
      extractedData: buildPendingExtractedData(message, extractedData, stages),
      confidenceScore,
      status: pendingStatus,
    });

    logger.info('AI pipeline created pending record', {
      pendingRecordId: pendingRecord._id,
      category: recordCategory,
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
