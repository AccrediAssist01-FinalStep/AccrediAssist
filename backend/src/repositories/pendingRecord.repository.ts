import { FilterQuery } from 'mongoose';
import { PendingRecord } from '../models/PendingRecord';
import { BaseRepository, PaginatedResult } from './base.repository';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { IPendingRecord, PendingRecordFilters } from '../types/pendingRecord.types';
import { PendingRecordStatus } from '../database/enums';

export class PendingRecordRepository extends BaseRepository<IPendingRecord> {
  constructor() {
    super(PendingRecord);
  }

  private buildFilterQuery(filters: PendingRecordFilters = {}): FilterQuery<IPendingRecord> {
    const query: FilterQuery<IPendingRecord> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.groupName) {
      query.groupName = { $regex: filters.groupName, $options: 'i' };
    }

    if (filters.senderName) {
      query.senderName = { $regex: filters.senderName, $options: 'i' };
    }

    return query;
  }

  async findWithFilters(
    filters: PendingRecordFilters = {},
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IPendingRecord>> {
    const result = await this.findAll(this.buildFilterQuery(filters), pagination);

    if (Array.isArray(result)) {
      return {
        items: result,
        meta: {
          total: result.length,
          page: pagination.page ?? 1,
          limit: pagination.limit ?? result.length,
          totalPages: 1,
        },
      };
    }

    return result;
  }

  async updateStatus(
    id: string,
    status: PendingRecordStatus,
    reviewedBy: string,
  ): Promise<IPendingRecord | null> {
    return this.update(
      id,
      {
        status,
        reviewedBy,
        reviewedAt: new Date(),
      } as Partial<IPendingRecord>,
      reviewedBy,
    );
  }
}

export const pendingRecordRepository = new PendingRecordRepository();
