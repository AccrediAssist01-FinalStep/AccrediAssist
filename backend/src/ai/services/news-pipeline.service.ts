import { pendingReviewService, PendingReviewService } from '../../services/pendingReview.service';
import { PendingRecordStatus } from '../../database/enums';
import { WhatsAppIncomingMessage } from '../../whatsapp/types';
import { resolveIncomingMessageText } from '../../whatsapp/message-text.util';
import { NewsDetectionResult } from '../interfaces/news-detection.interface';
import { AiPipelineResult } from '../interfaces/ai-pipeline.interface';
import { resolvePendingRecordStatus } from '../utils/pipeline-status.util';
import { logPipelineStage, PIPELINE_STAGES } from '../utils/pipeline-stage-logger.util';

export class NewsPipelineService {
  constructor(private readonly pendingReview: PendingReviewService = pendingReviewService) {}

  async processNewsMessage(
    message: WhatsAppIncomingMessage,
    newsResult: NewsDetectionResult,
  ): Promise<AiPipelineResult> {
    const originalMessage = resolveIncomingMessageText({
      message: message.message,
      media: message.media,
      mediaMetadata: message.mediaMetadata,
      sender: message.sender,
    });

    const imageUrl = message.media ?? message.mediaMetadata?.secureUrl ?? '';
    const confidenceScore = Math.round(newsResult.confidence ?? 0);

    const extractedData: Record<string, unknown> = {
      headline: newsResult.headline,
      articleText: newsResult.articleText,
      articleLanguage: newsResult.language,
      newspaperName: newsResult.newspaperName,
      publicationDate: newsResult.publicationDate,
      peopleMentioned: newsResult.peopleMentioned ?? [],
      organization: newsResult.organization,
      department: newsResult.department,
      articleCategory: newsResult.articleCategory ?? 'General',
      summary: newsResult.summary,
      imageUrl,
      media: imageUrl,
      mediaMetadata: message.mediaMetadata ?? null,
      sourceType: 'news',
      detectedCategory: 'News',
      activityModule: 'News',
      activitySubCategory: newsResult.articleCategory ?? 'General',
      aiPipeline: {
        newsDetection: newsResult,
      },
    };

    const pendingStatus = resolvePendingRecordStatus({
      validation: { validationStatus: 'valid', validationErrors: [] },
      duplicateDetection: { duplicate: false, similarityScore: 0, matchingRecordId: null },
      confidenceScore,
    });

    const pendingRecord = await this.pendingReview.createPendingRecord({
      originalMessage,
      groupName: message.groupName,
      senderName: message.sender,
      category: 'News',
      extractedData,
      confidenceScore,
      status: pendingStatus,
    });

    logPipelineStage(PIPELINE_STAGES.PENDING_REVIEW_CREATION, {
      pendingRecordId: pendingRecord._id,
      recordCategory: 'News',
      detectedCategory: 'News',
      sourceType: 'news',
      confidenceScore,
    });

    return {
      pendingRecord,
      stages: {} as AiPipelineResult['stages'],
      recordCategory: 'News',
      pendingStatus: pendingRecord.status as PendingRecordStatus,
      confidenceScore,
    };
  }
}

export const newsPipelineService = new NewsPipelineService();
