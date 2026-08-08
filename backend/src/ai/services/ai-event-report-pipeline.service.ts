import { pendingReviewService, PendingReviewService } from '../../services/pendingReview.service';
import { pendingRecordRepository } from '../../repositories/pendingRecord.repository';
import { IEventReportSession } from '../../types/eventReportSession.types';
import { AiPipelineResult } from '../interfaces/ai-pipeline.interface';
import { aiEventReportAgent } from '../agents/ai-event-report.agent';
import { inferCategoryFromEventReport } from '../utils/event-routing.util';
import { buildConversationTimeline, buildMediaItems } from '../utils/session-media.util';
import { logPipelineStage, PIPELINE_STAGES } from '../utils/pipeline-stage-logger.util';
import { NotFoundError } from '../../utils/errors';
import { toPendingRecordResponse } from '../../utils/pendingRecord.mapper';

interface ProcessSessionOptions {
  existingPendingRecordId?: string;
}

export class AiEventReportPipelineService {
  constructor(private readonly pendingReview: PendingReviewService = pendingReviewService) {}

  async processSession(
    session: IEventReportSession,
    options: ProcessSessionOptions = {},
  ): Promise<AiPipelineResult> {
    const agentResponse = await aiEventReportAgent.analyzeSession(
      session.groupName,
      session.messages,
    );

    const mediaItems = buildMediaItems(session.messages);
    const evidence = mediaItems.map((item) => {
      const imageObservation = agentResponse.result.imageObservations.find(
        (obs) => obs.reference === item.label,
      );
      const pdfObservation = agentResponse.result.pdfObservations.find(
        (obs) => obs.reference === item.label,
      );

      return {
        ...item,
        observation: imageObservation?.observation ?? pdfObservation?.observation,
      };
    });

    const agentResult = agentResponse.result;

    const category = inferCategoryFromEventReport({
      reportType: agentResult.reportType,
      title: agentResult.title,
      organization: agentResult.organization,
      summary: agentResult.summary,
      aiGeneratedReport: agentResult.aiGeneratedReport,
      keywords: agentResult.keywords,
    });

    const photoUrls = mediaItems.filter((item) => item.type === 'image').map((item) => item.url);
    const pdfUrls = mediaItems.filter((item) => item.type === 'pdf').map((item) => item.url);

    const originalMessage = buildConversationTimeline(session.messages).slice(0, 8000);

    const workshopReportStructured =
      category === 'Workshop' || category === 'Industrial Visit' || category === 'Seminar'
        ? agentResult.workshopReportStructured
        : undefined;

    const extractedData: Record<string, unknown> = {
      title: agentResult.title,
      eventName: agentResult.title,
      date: agentResult.date,
      time: agentResult.time,
      venue: agentResult.venue,
      location: agentResult.venue,
      department: agentResult.department,
      coordinator: agentResult.coordinator,
      chiefGuest: agentResult.chiefGuest,
      speaker: agentResult.speaker,
      organization: agentResult.organization,
      participants: agentResult.participants,
      objectives: agentResult.objectives,
      activitiesConducted: agentResult.activitiesConducted,
      learningOutcomes: agentResult.learningOutcomes,
      keyHighlights: agentResult.keyHighlights,
      achievements: agentResult.achievements,
      futureScope: agentResult.futureScope,
      conclusion: agentResult.conclusion,
      summary: agentResult.summary,
      keywords: agentResult.keywords,
      missingFields: agentResult.missingFields,
      aiGeneratedReport: agentResult.aiGeneratedReport,
      validationNotes: agentResult.validationNotes,
      description: agentResult.aiGeneratedReport,
      media: mediaItems,
      evidence,
      mediaReferences: mediaItems.map((item) => item.url),
      certificates: pdfUrls,
      photoUrls,
      imageObservations: agentResult.imageObservations,
      pdfObservations: agentResult.pdfObservations,
      ...(workshopReportStructured ? { workshopReportStructured } : {}),
      sourceType: 'ai-event-report',
      detectedCategory: category,
      activityModule: 'AI Event Report',
      activitySubCategory: agentResult.reportType,
      eventType: category,
      reportType: agentResult.reportType,
      sessionId: session._id?.toString(),
      messageCount: session.messages.length,
      conversationTimeline: buildConversationTimeline(session.messages),
      mediaCount: mediaItems.length,
      imageCount: photoUrls.length,
      pdfCount: pdfUrls.length,
      aiPipeline: {
        aiEventReport: agentResult,
        model: agentResponse.model,
      },
    };

    const confidenceScore = agentResult.confidenceScore;

    logPipelineStage(PIPELINE_STAGES.GEMINI_RESPONSE, {
      stage: 'ai-event-report',
      model: agentResponse.model,
      reportType: agentResult.reportType,
      confidence: confidenceScore,
      messageCount: session.messages.length,
      evidenceCount: evidence.length,
    });

    let pendingRecord;

    if (options.existingPendingRecordId) {
      const updated = await pendingRecordRepository.update(
        options.existingPendingRecordId,
        {
          originalMessage,
          groupName: session.groupName,
          senderName: session.messages[0]?.sender,
          category,
          extractedData,
          confidenceScore,
          status: 'Pending',
        },
      );

      if (!updated) {
        throw new NotFoundError('Pending record not found for regeneration');
      }

      pendingRecord = toPendingRecordResponse(updated);
    } else {
      pendingRecord = await this.pendingReview.createPendingRecord({
        originalMessage,
        groupName: session.groupName,
        senderName: session.messages[0]?.sender,
        category,
        extractedData,
        confidenceScore,
      });
    }

    logPipelineStage(PIPELINE_STAGES.PENDING_REVIEW_CREATION, {
      pendingRecordId: pendingRecord._id,
      recordCategory: category,
      sourceType: 'ai-event-report',
      status: pendingRecord.status,
      confidenceScore,
      sessionId: session._id,
    });

    return {
      pendingRecord,
      stages: {} as AiPipelineResult['stages'],
      recordCategory: category,
      pendingStatus: pendingRecord.status,
      confidenceScore,
    };
  }
}

export const aiEventReportPipelineService = new AiEventReportPipelineService();
