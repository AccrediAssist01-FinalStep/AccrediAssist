import mongoose from 'mongoose';
import { pendingRecordRepository } from '../repositories/pendingRecord.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import {
  IPendingRecord,
  IPendingRecordResponse,
  RejectPendingRecordInput,
} from '../types/pendingRecord.types';
import { toPendingRecordResponse } from '../utils/pendingRecord.mapper';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';

const REVIEWABLE_STATUSES = ['Pending', 'Needs Review'] as const;
const FINAL_STATUSES = ['Approved', 'Rejected'] as const;

export class PendingRecordRejectionService {
  async rejectPendingRecord(
    id: string,
    userId: string,
    input: RejectPendingRecordInput,
  ): Promise<IPendingRecordResponse> {
    const existing = await pendingRecordRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Pending record not found');
    }

    this.ensureRejectable(existing);

    const reviewedAt = new Date();
    const reason = input.reason.trim();

    logger.info('Rejecting pending record', {
      pendingRecordId: id,
      userId,
      reason,
    });

    const rejected = await pendingRecordRepository.update(
      id,
      {
        status: 'Rejected',
        rejectionReason: reason,
        reviewedBy: new mongoose.Types.ObjectId(userId),
        reviewedAt,
      },
      userId,
    );

    if (!rejected) {
      throw new BadRequestError('Failed to reject pending record');
    }

    await auditLogRepository.create({
      userId,
      action: 'REJECT',
      module: 'PendingRecord',
      description: `Pending record ${id} rejected: ${reason}`,
      timestamp: reviewedAt,
    });

    const response = toPendingRecordResponse(rejected);

    await notificationService.safelyNotify(() =>
      notificationService.notifyFacultyPendingRecordRejected(response),
    );

    return response;
  }

  private ensureRejectable(record: IPendingRecord): void {
    if (FINAL_STATUSES.includes(record.status as (typeof FINAL_STATUSES)[number])) {
      throw new BadRequestError(`Cannot reject a record with status "${record.status}"`);
    }

    if (
      !REVIEWABLE_STATUSES.includes(record.status as (typeof REVIEWABLE_STATUSES)[number])
    ) {
      throw new BadRequestError(`Cannot reject a record with status "${record.status}"`);
    }
  }
}

export const pendingRecordRejectionService = new PendingRecordRejectionService();
