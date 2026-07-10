import { FilterQuery } from 'mongoose';
import { PendingRecord } from '../models/PendingRecord';
import { BaseRepository, PaginatedResult } from './base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import {
  IPendingRecord,
  PendingRecordFilters,
  PendingRecordSort,
} from '../types/pendingRecord.types';
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

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { originalMessage: searchRegex },
        { groupName: searchRegex },
        { senderName: searchRegex },
      ];
    }

    return query;
  }

  async findWithFilters(
    filters: PendingRecordFilters = {},
    pagination: PaginationOptions,
    sort: PendingRecordSort,
  ): Promise<PaginatedResult<IPendingRecord>> {
    const query = withActiveFilter(this.buildFilterQuery(filters));
    const pageOptions = getPagination(pagination);
    const sortOrder = sort.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ [sort.sortBy]: sortOrder })
        .skip(pageOptions.skip)
        .limit(pageOptions.limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      items,
      meta: buildPaginationMeta(total, pageOptions),
    };
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
