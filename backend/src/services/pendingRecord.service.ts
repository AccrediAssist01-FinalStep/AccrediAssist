import { pendingRecordRepository } from '../repositories/pendingRecord.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { pendingRecordApprovalService } from './pendingRecordApproval.service';
import { pendingRecordMoveService } from './pendingRecordMove.service';
import { pendingRecordRejectionService } from './pendingRecordRejection.service';
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
import { MovePendingRecordBody } from '../validations/pendingRecordMove.validation';

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
    return pendingRecordApprovalService.approvePendingRecord(id, userId);
  }

  async rejectPendingRecord(
    id: string,
    userId: string,
    input: RejectPendingRecordInput,
  ): Promise<IPendingRecordResponse> {
    return pendingRecordRejectionService.rejectPendingRecord(id, userId, input);
  }

  async moveApprovedPendingRecord(
    id: string,
    userId: string,
    input: MovePendingRecordBody,
  ): Promise<IPendingRecordResponse> {
    return pendingRecordMoveService.moveApprovedPendingRecord(id, userId, input);
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
