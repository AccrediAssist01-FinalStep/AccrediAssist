import { pendingReviewService, PendingReviewService } from '../../services/pendingReview.service';
import { pendingRecordRepository } from '../../repositories/pendingRecord.repository';
import { IEventReportSession } from '../../types/eventReportSession.types';
import { AiPipelineResult } from '../interfaces/ai-pipeline.interface';
import { aiEventReportAgent } from '../agents/ai-event-report.agent';
import { mapReportTypeToCategory } from '../utils/event-routing.util';
import { buildConversationTimeline, buildEvidenceItems } from '../utils/session-media.util';
import { logPipelineStage, PIPELINE_STAGES } from '../utils/pipeline-stage-logger.util';
import { RecordCategory } from '../../database/enums';
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

    const evidence = buildEvidenceItems(session.messages).map((item) => {
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

    const category = mapReportTypeToCategory(
      agentResponse.result.reportType,
    ) as RecordCategory;

    const originalMessage = buildConversationTimeline(session.messages).slice(0, 8000);
    const photoUrls = evidence
      .filter((item) => item.type === 'image')
      .map((item) => item.url);
    const pdfUrls = evidence
      .filter((item) => item.type === 'pdf')
      .map((item) => item.url);

    const extractedData: Record<string, unknown> = {
      title: agentResponse.result.title,
      eventName: agentResponse.result.title,
      date: agentResponse.result.date,
      time: agentResponse.result.time,
      venue: agentResponse.result.venue,
      location: agentResponse.result.venue,
      department: agentResponse.result.department,
      coordinator: agentResponse.result.coordinator,
      chiefGuest: agentResponse.result.chiefGuest,
      speaker: agentResponse.result.speaker,
      organization: agentResponse.result.organization,
      participants: agentResponse.result.participants,
      objectives: agentResponse.result.objectives,
      activitiesConducted: agentResponse.result.activitiesConducted,
      learningOutcomes: agentResponse.result.learningOutcomes,
      keyHighlights: agentResponse.result.keyHighlights,
      achievements: agentResponse.result.achievements,
      futureScope: agentResponse.result.futureScope,
      conclusion: agentResponse.result.conclusion,
      summary: agentResponse.result.summary,
      keywords: agentResponse.result.keywords,
      missingFields: agentResponse.result.missingFields,
      aiGeneratedReport: agentResponse.result.aiGeneratedReport,
      validationNotes: agentResponse.result.validationNotes,
      description: agentResponse.result.aiGeneratedReport,
      evidence,
      mediaReferences: evidence.map((item) => item.url),
      certificates: pdfUrls,
      photoUrls,
      imageObservations: agentResponse.result.imageObservations,
      pdfObservations: agentResponse.result.pdfObservations,
      sourceType: 'ai-event-report',
      detectedCategory: category,
      activityModule: 'AI Event Report',
      activitySubCategory: agentResponse.result.reportType,
      eventType: category,
      reportType: agentResponse.result.reportType,
      sessionId: session._id?.toString(),
      messageCount: session.messages.length,
      aiPipeline: {
        aiEventReport: agentResponse.result,
        model: agentResponse.model,
      },
    };

    const confidenceScore = agentResponse.result.confidenceScore;

    logPipelineStage(PIPELINE_STAGES.GEMINI_RESPONSE, {
      stage: 'ai-event-report',
      model: agentResponse.model,
      reportType: agentResponse.result.reportType,
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
          status: 'Needs Review',
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
        status: 'Needs Review',
      });
    }

    logPipelineStage(PIPELINE_STAGES.PENDING_REVIEW_CREATION, {
      pendingRecordId: pendingRecord._id,
      recordCategory: category,
      sourceType: 'ai-event-report',
      status: 'Needs Review',
      confidenceScore,
      sessionId: session._id,
    });

    return {
      pendingRecord,
      stages: {} as AiPipelineResult['stages'],
      recordCategory: category,
      pendingStatus: 'Needs Review',
      confidenceScore,
    };
  }
}

export const aiEventReportPipelineService = new AiEventReportPipelineService();
