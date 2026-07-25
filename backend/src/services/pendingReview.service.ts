import { pendingRecordRepository, PendingRecordRepository } from '../repositories/pendingRecord.repository';
import { PaginatedResult } from '../repositories/base.repository';
import {
  CreatePendingRecordInput,
  IPendingRecord,
  IPendingRecordResponse,
  UpdatePendingRecordInput,
} from '../types/pendingRecord.types';
import {
  DEFAULT_PENDING_REVIEW_LIST_OPTIONS,
  PendingReviewListOptions,
} from '../types/pendingReview.types';
import { toPendingRecordResponse } from '../utils/pendingRecord.mapper';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';

const REVIEWABLE_STATUSES = ['Pending', 'Needs Review'] as const;
const FINAL_STATUSES = ['Approved', 'Rejected'] as const;

export class PendingReviewService {
  constructor(private readonly repository: PendingRecordRepository = pendingRecordRepository) {}

  async createPendingRecord(input: CreatePendingRecordInput): Promise<IPendingRecordResponse> {
    logger.info('Creating pending review record', {
      category: input.category,
      status: input.status ?? 'Pending',
    });

    const record = await this.repository.create({
      originalMessage: input.originalMessage,
      groupName: input.groupName,
      senderName: input.senderName,
      category: input.category,
      extractedData: input.extractedData ?? {},
      confidenceScore: input.confidenceScore ?? 0,
      status: input.status ?? 'Pending',
    });

    const response = toPendingRecordResponse(record);

    await notificationService.safelyNotify(() =>
      notificationService.notifyFacultyPendingRecordCreated(response),
    );

    return response;
  }

  async updatePendingRecord(
    id: string,
    input: UpdatePendingRecordInput,
  ): Promise<IPendingRecordResponse> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError('Pending record not found');
    }

    this.ensureReviewable(existing);

    logger.info('Updating pending review record', { pendingRecordId: id });

    const updated = await this.repository.update(id, input);

    if (!updated) {
      throw new NotFoundError('Pending record not found');
    }

    return toPendingRecordResponse(updated);
  }

  async getPendingRecordById(id: string): Promise<IPendingRecordResponse> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw new NotFoundError('Pending record not found');
    }

    return toPendingRecordResponse(record);
  }

  async getAllPendingRecords(
    options: PendingReviewListOptions = {},
  ): Promise<PaginatedResult<IPendingRecordResponse>> {
    const pagination = {
      ...DEFAULT_PENDING_REVIEW_LIST_OPTIONS.pagination,
      ...options.pagination,
    };
    const sort = {
      ...DEFAULT_PENDING_REVIEW_LIST_OPTIONS.sort,
      ...options.sort,
    };

    logger.info('Listing pending review records', {
      status: options.status,
      category: options.category,
      title: options.title,
      pagination,
      sort,
    });

    const result = await this.repository.findWithFilters(
      {
        status: options.status,
        category: options.category,
        title: options.title,
        search: options.search,
        groupName: options.groupName,
        senderName: options.senderName,
      },
      pagination,
      sort,
    );

    return {
      items: result.items.map((record) => toPendingRecordResponse(record)),
      meta: result.meta,
    };
  }

  private ensureReviewable(record: IPendingRecord): void {
    if (FINAL_STATUSES.includes(record.status as (typeof FINAL_STATUSES)[number])) {
      throw new BadRequestError(`Cannot update a record with status "${record.status}"`);
    }

    if (
      !REVIEWABLE_STATUSES.includes(record.status as (typeof REVIEWABLE_STATUSES)[number])
    ) {
      throw new BadRequestError(`Cannot update a record with status "${record.status}"`);
    }
  }
}

export const pendingReviewService = new PendingReviewService();
