import { EventReportSession } from '../models/EventReportSession';
import { aiEventReportPipelineService } from '../ai/services/ai-event-report-pipeline.service';
import { EventReportSessionMessage } from '../types/eventReportSession.types';
import {
  shouldAppendToEventReportSession,
  shouldStartEventReportSession,
} from '../ai/utils/event-routing.util';
import { isImageMessage, isPdfMessage } from '../ai/utils/media-detection.util';
import { countSessionMedia } from '../ai/utils/session-media.util';
import { WhatsAppIncomingMessage } from '../whatsapp/types';
import { logger } from '../utils/logger';
import { pendingRecordAutoReviewService } from './pendingRecordAutoReview.service';

const IDLE_FLUSH_MS =
  process.env.NODE_ENV === 'development'
    ? Number(process.env.EVENT_SESSION_IDLE_FLUSH_MS ?? 15_000)
    : 3 * 60 * 1000;
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

  async hasCollectingSession(groupName: string): Promise<boolean> {
    return Boolean(await EventReportSession.exists({ groupName, status: 'collecting' }));
  }

  async handleMessage(message: WhatsAppIncomingMessage): Promise<boolean> {
    const groupName = message.groupName;
    const sessionMessage = toSessionMessage(message);

    const hasActiveSession = Boolean(
      await EventReportSession.exists({ groupName, status: 'collecting' }),
    );

    const shouldStart = shouldStartEventReportSession(message);
    const isEventMedia = isImageMessage(message) || isPdfMessage(message) || Boolean(message.media);

    if (!shouldAppendToEventReportSession(message, hasActiveSession)) {
      if (isEventMedia) {
        const appended = await this.appendMessageAtomically(groupName, sessionMessage);
        if (appended) {
          this.onSessionUpdated(groupName, appended._id.toString(), appended.messages);
          return true;
        }
      }
      return false;
    }

    const session = await this.appendOrCreateSessionAtomically(groupName, sessionMessage);
    if (!session) {
      return false;
    }

    if (shouldStart && !this.sessionStartedAt.has(groupName)) {
      this.sessionStartedAt.set(groupName, Date.now());
      logger.info('Started AI event report session', {
        sessionId: session._id,
        groupName,
      });
    }

    this.onSessionUpdated(groupName, session._id.toString(), session.messages);

    const startedAt =
      this.sessionStartedAt.get(groupName) ??
      (session.createdAt instanceof Date ? session.createdAt.getTime() : Date.now());

    if (Date.now() - startedAt >= MAX_SESSION_MS) {
      await this.flushSession(session._id.toString());
    }

    return true;
  }

  private onSessionUpdated(
    groupName: string,
    sessionId: string,
    messages: EventReportSessionMessage[],
  ): void {
    const mediaCounts = countSessionMedia(messages);
    logger.info('Event report session updated', {
      sessionId,
      groupName,
      messageCount: messages.length,
      ...mediaCounts,
    });
    this.scheduleIdleFlush(groupName, sessionId);
  }

  /** Atomic $push — prevents concurrent image uploads from overwriting each other */
  private appendOrCreateSessionAtomically(
    groupName: string,
    sessionMessage: EventReportSessionMessage,
  ) {
    return EventReportSession.findOneAndUpdate(
      { groupName, status: 'collecting' },
      {
        $push: { messages: sessionMessage },
        $set: { lastMessageAt: new Date() },
        $setOnInsert: { groupName, status: 'collecting' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  /** Append media to an existing session without creating a new one (handles text/image race) */
  private appendMessageAtomically(groupName: string, sessionMessage: EventReportSessionMessage) {
    return EventReportSession.findOneAndUpdate(
      { groupName, status: 'collecting' },
      {
        $push: { messages: sessionMessage },
        $set: { lastMessageAt: new Date() },
      },
      { new: true },
    );
  }

  async flushSession(sessionId: string, options: { allowProcessingRetry?: boolean } = {}): Promise<void> {
    if (this.flushingSessions.has(sessionId)) {
      return;
    }

    this.flushingSessions.add(sessionId);

    try {
      const session = await EventReportSession.findById(sessionId);
      const allowedStatuses = options.allowProcessingRetry
        ? ['collecting', 'processing']
        : ['collecting'];

      if (!session || !allowedStatuses.includes(session.status)) {
        return;
      }

      session.status = 'processing';
      await session.save();

      const idleTimer = this.idleTimers.get(session.groupName);
      if (idleTimer) {
        clearTimeout(idleTimer);
        this.idleTimers.delete(session.groupName);
      }

      const mediaCounts = countSessionMedia(session.messages);
      logger.info('Flushing AI event report session', {
        sessionId,
        groupName: session.groupName,
        messageCount: session.messages.length,
        ...mediaCounts,
      });

      const result = await aiEventReportPipelineService.processSession(session);

      const autoReview = await pendingRecordAutoReviewService.resolveByConfidence(
        result.pendingRecord._id,
        result.confidenceScore,
      );

      session.status = 'completed';
      session.processedAt = new Date();
      session.pendingRecordId = autoReview.record._id;
      await session.save();

      this.sessionStartedAt.delete(session.groupName);

      logger.info('AI event report session completed', {
        sessionId,
        pendingRecordId: autoReview.record._id,
        confidenceScore: result.confidenceScore,
        autoReviewAction: autoReview.action,
        pendingStatus: autoReview.record.status,
        mediaStored: mediaCounts.total,
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

  /** Re-schedule flush timers after server restart for sessions still collecting in MongoDB */
  async recoverCollectingSessions(): Promise<void> {
    const collecting = await EventReportSession.find({ status: 'collecting' }).sort({
      lastMessageAt: 1,
    });

    if (collecting.length === 0) {
      return;
    }

    logger.info('Recovering collecting AI event report sessions', {
      count: collecting.length,
      idleFlushMs: IDLE_FLUSH_MS,
    });

    for (const session of collecting) {
      const sessionId = session._id.toString();
      const groupName = session.groupName;
      const lastAt =
        session.lastMessageAt instanceof Date
          ? session.lastMessageAt.getTime()
          : session.createdAt instanceof Date
            ? session.createdAt.getTime()
            : Date.now();

      this.sessionStartedAt.set(groupName, lastAt);

      const idleForMs = Date.now() - lastAt;
      if (idleForMs >= IDLE_FLUSH_MS) {
        logger.info('Flushing stale collecting session immediately', {
          sessionId,
          groupName,
          idleForMs,
        });
        void this.flushSession(sessionId);
      } else {
        const remainingMs = IDLE_FLUSH_MS - idleForMs;
        logger.info('Re-scheduled collecting session flush', {
          sessionId,
          groupName,
          remainingMs,
        });
        this.idleTimers.set(
          groupName,
          setTimeout(() => {
            void this.flushSession(sessionId);
          }, remainingMs),
        );
      }
    }
  }

  /** Retry sessions stuck in processing after a server restart killed Gemini mid-flight */
  async recoverStuckProcessingSessions(): Promise<void> {
    const STUCK_PROCESSING_MS = 2 * 60 * 1000;
    const stuck = await EventReportSession.find({ status: 'processing' });

    for (const session of stuck) {
      const lastAt =
        session.lastMessageAt instanceof Date
          ? session.lastMessageAt.getTime()
          : session.updatedAt instanceof Date
            ? session.updatedAt.getTime()
            : Date.now();

      if (Date.now() - lastAt < STUCK_PROCESSING_MS) {
        continue;
      }

      logger.warn('Retrying stuck processing session', {
        sessionId: session._id.toString(),
        groupName: session.groupName,
        stuckForMs: Date.now() - lastAt,
      });

      void this.flushSession(session._id.toString(), { allowProcessingRetry: true });
    }
  }

  async recoverInterruptedSessions(): Promise<void> {
    await this.recoverCollectingSessions();
    await this.recoverStuckProcessingSessions();
  }

  async flushCollectingSessionsNow(): Promise<number> {
    const collecting = await EventReportSession.find({ status: 'collecting' });
    await Promise.all(collecting.map((session) => this.flushSession(session._id.toString())));
    return collecting.length;
  }
}

export const eventCorrelationService = new EventCorrelationService();
