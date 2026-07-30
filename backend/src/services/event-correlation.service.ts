import { EventReportSession } from '../models/EventReportSession';
import { aiEventReportPipelineService } from '../ai/services/ai-event-report-pipeline.service';
import { EventReportSessionMessage } from '../types/eventReportSession.types';
import {
  shouldAppendToEventReportSession,
} from '../ai/utils/event-routing.util';
import { WhatsAppIncomingMessage } from '../whatsapp/types';
import { logger } from '../utils/logger';

const IDLE_FLUSH_MS = 3 * 60 * 1000;
const MAX_SESSION_MS = 90 * 60 * 1000;

const toSessionMessage = (message: WhatsAppIncomingMessage): EventReportSessionMessage => ({
  text: [message.message, message.mediaMetadata?.caption].filter(Boolean).join('\n').trim(),
  sender: message.sender,
  media: message.media ?? message.mediaMetadata?.secureUrl ?? undefined,
  mediaMetadata: message.mediaMetadata ?? null,
  receivedAt: message.timestamp ?? new Date(),
});

export class EventCorrelationService {
  private idleTimers = new Map<string, NodeJS.Timeout>();
  private sessionStartedAt = new Map<string, number>();
  private flushingSessions = new Set<string>();

  async handleMessage(message: WhatsAppIncomingMessage): Promise<boolean> {
    const groupName = message.groupName;
    const activeSession = await EventReportSession.findOne({
      groupName,
      status: 'collecting',
    }).sort({ lastMessageAt: -1 });

    const hasActiveSession = Boolean(activeSession);
    if (!shouldAppendToEventReportSession(message, hasActiveSession)) {
      return false;
    }

    const sessionMessage = toSessionMessage(message);

    let session = activeSession;
    if (!session) {
      session = await EventReportSession.create({
        groupName,
        messages: [sessionMessage],
        status: 'collecting',
        lastMessageAt: new Date(),
      });
      this.sessionStartedAt.set(groupName, Date.now());
      logger.info('Started AI event report session', {
        sessionId: session._id,
        groupName,
      });
    } else {
      session.messages.push(sessionMessage);
      session.lastMessageAt = new Date();
      await session.save();
    }

    this.scheduleIdleFlush(groupName, session._id.toString());

    const startedAt =
      this.sessionStartedAt.get(groupName) ??
      (session.createdAt instanceof Date ? session.createdAt.getTime() : Date.now());

    if (Date.now() - startedAt >= MAX_SESSION_MS) {
      await this.flushSession(session._id.toString());
    }

    return true;
  }

  async flushSession(sessionId: string): Promise<void> {
    if (this.flushingSessions.has(sessionId)) {
      return;
    }

    this.flushingSessions.add(sessionId);

    try {
      const session = await EventReportSession.findById(sessionId);
      if (!session || session.status !== 'collecting') {
        return;
      }

      session.status = 'processing';
      await session.save();

      const idleTimer = this.idleTimers.get(session.groupName);
      if (idleTimer) {
        clearTimeout(idleTimer);
        this.idleTimers.delete(session.groupName);
      }

      logger.info('Flushing AI event report session', {
        sessionId,
        groupName: session.groupName,
        messageCount: session.messages.length,
      });

      const result = await aiEventReportPipelineService.processSession(session);

      session.status = 'completed';
      session.processedAt = new Date();
      session.pendingRecordId = result.pendingRecord._id;
      await session.save();

      this.sessionStartedAt.delete(session.groupName);

      logger.info('AI event report session completed', {
        sessionId,
        pendingRecordId: result.pendingRecord._id,
        confidenceScore: result.confidenceScore,
      });
    } catch (error) {
      await EventReportSession.findByIdAndUpdate(sessionId, {
        status: 'failed',
        processedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      logger.error('AI event report session failed', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.flushingSessions.delete(sessionId);
    }
  }

  async regenerateFromSession(sessionId: string, pendingRecordId?: string) {
    const session = await EventReportSession.findById(sessionId);
    if (!session) {
      throw new Error('Event report session not found');
    }

    return aiEventReportPipelineService.processSession(session, {
      existingPendingRecordId: pendingRecordId ?? session.pendingRecordId?.toString(),
    });
  }

  private scheduleIdleFlush(groupName: string, sessionId: string): void {
    const existing = this.idleTimers.get(groupName);
    if (existing) {
      clearTimeout(existing);
    }

    this.idleTimers.set(
      groupName,
      setTimeout(() => {
        void this.flushSession(sessionId);
      }, IDLE_FLUSH_MS),
    );
  }
}

export const eventCorrelationService = new EventCorrelationService();
