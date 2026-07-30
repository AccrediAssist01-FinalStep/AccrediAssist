import { pendingRecordRepository } from '../repositories/pendingRecord.repository';
import { EventReportSession } from '../models/EventReportSession';
import { eventCorrelationService } from './event-correlation.service';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { IPendingRecordResponse } from '../types/pendingRecord.types';

export class PendingRecordRegenerateService {
  async regenerateAiEventReport(id: string): Promise<IPendingRecordResponse> {
    const existing = await pendingRecordRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Pending record not found');
    }

    const extracted = existing.extractedData ?? {};
    const sourceType = extracted.sourceType;

    if (sourceType !== 'ai-event-report') {
      throw new BadRequestError('Regeneration is only available for AI event reports');
    }

    const sessionId =
      typeof extracted.sessionId === 'string'
        ? extracted.sessionId
        : existing._id
          ? (
              await EventReportSession.findOne({ pendingRecordId: existing._id }).select('_id')
            )?._id?.toString()
          : undefined;

    if (!sessionId) {
      throw new BadRequestError('Original WhatsApp session not found for this report');
    }

    const result = await eventCorrelationService.regenerateFromSession(sessionId, id);
    return result.pendingRecord;
  }
}

export const pendingRecordRegenerateService = new PendingRecordRegenerateService();
