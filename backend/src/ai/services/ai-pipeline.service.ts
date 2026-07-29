import { pendingReviewService, PendingReviewService } from '../../services/pendingReview.service';
import { logger } from '../../utils/logger';
import { WhatsAppIncomingMessage } from '../../whatsapp/types';
import { resolveIncomingMessageText } from '../../whatsapp/message-text.util';
import { ClassificationAgent, classificationAgent } from '../agents/classification.agent';
import { DuplicateDetectionAgent, duplicateDetectionAgent } from '../agents/duplicate-detection.agent';
import { ExtractionAgent, extractionAgent } from '../agents/extraction.agent';
import { ValidationAgent, validationAgent } from '../agents/validation.agent';
import { AiPipelineResult, AiPipelineStageResults } from '../interfaces/ai-pipeline.interface';
import { ExtractionResult } from '../interfaces/extraction.interface';
import { resolveActivityClassification } from '../utils/activity-module.util';
import { enrichExtractionAchievementType } from '../utils/achievement-inference.util';
import { enrichExtractionFields } from '../utils/extraction-enrichment.util';
import { correctClassificationForExtraction } from '../utils/classification-correction.util';
import { mapClassificationToRecordCategory } from '../utils/category-mapper.util';
import {
  calculatePipelineConfidenceScore,
  resolvePendingRecordStatus,
} from '../utils/pipeline-status.util';
import { logPipelineStage, PIPELINE_STAGES } from '../utils/pipeline-stage-logger.util';

const buildPendingExtractedData = (
  message: WhatsAppIncomingMessage,
  extraction: ExtractionResult,
  stages: AiPipelineStageResults,
  detectedCategory: string,
  activityModule: string,
  activitySubCategory: string,
): Record<string, unknown> => ({
  ...extraction,
  media: message.media,
  mediaMetadata: message.mediaMetadata ?? null,
  detectedCategory,
  activityModule,
  activitySubCategory,
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

    const extractionResponse = await this.extraction.extract(message);
    const extractedData = enrichExtractionFields(
      enrichExtractionAchievementType(extractionResponse.result),
      originalMessage,
    );

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

    const duplicateDetectionResponse = await this.duplicateDetection.detect({
      category: correctedClassification.category,
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

    const recordCategory = mapClassificationToRecordCategory(
      correctedClassification.category,
      extractedData,
    );

    const activity = resolveActivityClassification(recordCategory, extractedData);

    const stages: AiPipelineStageResults = {
      extraction: extractionResponse,
      classification: {
        ...classificationResponse,
        result: correctedClassification,
      },
      validation: validationResponse,
      duplicateDetection: duplicateDetectionResponse,
    };

    const pendingRecord = await this.pendingReview.createPendingRecord({
      originalMessage,
      groupName: message.groupName,
      senderName: message.sender,
      category: recordCategory,
      extractedData: buildPendingExtractedData(
        message,
        extractedData,
        stages,
        correctedClassification.category,
        activity.module,
        activity.subCategory,
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
