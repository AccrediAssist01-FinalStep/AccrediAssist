import { pendingRecordRepository } from '../repositories/pendingRecord.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { BaseService } from './base.service';
import {
  IPendingRecord,
  IPendingRecordResponse,
  PendingRecordFilters,
  PendingRecordSort,
  RejectPendingRecordInput,
  UpdatePendingRecordInput,
} from '../types/pendingRecord.types';
import { toPendingRecordResponse } from '../utils/pendingRecord.mapper';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';
import { UpdatePendingRecordBody } from '../validations/pendingRecord.validation';

const REVIEWABLE_STATUSES = ['Pending', 'Needs Review'] as const;
const FINAL_STATUSES = ['Approved', 'Rejected'] as const;

export class PendingRecordService extends BaseService<
  IPendingRecord,
  IPendingRecordResponse,
  never,
  UpdatePendingRecordInput
> {
  constructor() {
    super(pendingRecordRepository);
  }

  protected toResponse(document: IPendingRecord): IPendingRecordResponse {
    return toPendingRecordResponse(document);
  }

  protected buildCreateData(): Partial<IPendingRecord> {
    throw new BadRequestError('Creating pending records via API is not supported');
  }

  protected buildUpdateData(input: UpdatePendingRecordInput): Partial<IPendingRecord> {
    return input;
  }

  async listPendingRecords(
    filters: PendingRecordFilters,
    pagination: PaginationOptions,
    sort: PendingRecordSort,
  ): Promise<PaginatedResult<IPendingRecordResponse>> {
    logger.info('Listing pending records', { filters, pagination, sort });

    const result = await pendingRecordRepository.findWithFilters(filters, pagination, sort);

    return {
      items: result.items.map((record) => this.toResponse(record)),
      meta: result.meta,
    };
  }

  async updatePendingRecord(
    id: string,
    input: UpdatePendingRecordBody,
    userId: string,
  ): Promise<IPendingRecordResponse> {
    const existing = await pendingRecordRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Pending record not found');
    }

    this.ensureReviewable(existing, 'update');

    logger.info('Updating pending record', { pendingRecordId: id, userId });

    const updated = await this.update(id, input, userId);

    await auditLogRepository.create({
      userId,
      action: 'UPDATE',
      module: 'PendingRecord',
      description: `Pending record ${id} updated`,
    });

    return updated;
  }

  async approvePendingRecord(id: string, userId: string): Promise<IPendingRecordResponse> {
    const existing = await pendingRecordRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Pending record not found');
    }

    this.ensureReviewable(existing, 'approve');

    logger.info('Approving pending record', { pendingRecordId: id, userId });

    const approved = await pendingRecordRepository.updateStatus(id, 'Approved', userId);

    if (!approved) {
      throw new BadRequestError('Failed to approve pending record');
    }

    await auditLogRepository.create({
      userId,
      action: 'APPROVE',
      module: 'PendingRecord',
      description: `Pending record ${id} approved`,
    });

    return this.toResponse(approved);
  }

  async rejectPendingRecord(
    id: string,
    userId: string,
    input?: RejectPendingRecordInput,
  ): Promise<IPendingRecordResponse> {
    const existing = await pendingRecordRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Pending record not found');
    }

    this.ensureReviewable(existing, 'reject');

    logger.info('Rejecting pending record', {
      pendingRecordId: id,
      userId,
      reason: input?.reason,
    });

    const updateData: Partial<IPendingRecord> = {
      status: 'Rejected',
      reviewedBy: userId,
      reviewedAt: new Date(),
    };

    if (input?.reason) {
      updateData.extractedData = {
        ...(existing.extractedData ?? {}),
        rejectionReason: input.reason,
      };
    }

    const rejected = await pendingRecordRepository.update(id, updateData, userId);

    if (!rejected) {
      throw new BadRequestError('Failed to reject pending record');
    }

    await auditLogRepository.create({
      userId,
      action: 'REJECT',
      module: 'PendingRecord',
      description: `Pending record ${id} rejected${input?.reason ? `: ${input.reason}` : ''}`,
    });

    return this.toResponse(rejected);
  }

  private ensureReviewable(
    record: IPendingRecord,
    action: 'approve' | 'reject' | 'update',
  ): void {
    if (FINAL_STATUSES.includes(record.status as (typeof FINAL_STATUSES)[number])) {
      throw new BadRequestError(`Cannot ${action} a record with status "${record.status}"`);
    }

    if (
      action === 'update' &&
      !REVIEWABLE_STATUSES.includes(record.status as (typeof REVIEWABLE_STATUSES)[number])
    ) {
      throw new BadRequestError(`Cannot update a record with status "${record.status}"`);
    }
  }
}

export const pendingRecordService = new PendingRecordService();
