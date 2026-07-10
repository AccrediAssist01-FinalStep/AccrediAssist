import { FilterQuery, Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import { PaginatedResult } from './base.repository';
import {
  AuditLogFilters,
  AuditLogSort,
  CreateAuditLogInput,
  IAuditLog,
} from '../types/auditLog.types';

export class AuditLogRepository {
  async create(data: CreateAuditLogInput): Promise<void> {
    await AuditLog.create({
      userId: data.userId,
      action: data.action,
      module: data.module,
      description: data.description,
      ipAddress: data.ipAddress,
      timestamp: data.timestamp ?? new Date(),
    });
  }

  private buildFilterQuery(filters: AuditLogFilters = {}): FilterQuery<IAuditLog> {
    const query: FilterQuery<IAuditLog> = {};

    if (filters.userId) {
      query.userId = new Types.ObjectId(filters.userId);
    }

    if (filters.module) {
      query.module = { $regex: filters.module, $options: 'i' };
    }

    if (filters.action) {
      query.action = { $regex: filters.action, $options: 'i' };
    }

    if (filters.fromDate || filters.toDate) {
      query.timestamp = {};
      if (filters.fromDate) {
        query.timestamp.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.timestamp.$lte = filters.toDate;
      }
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { action: searchRegex },
        { module: searchRegex },
        { description: searchRegex },
      ];
    }

    return query;
  }

  async findWithFilters(
    filters: AuditLogFilters = {},
    pagination: PaginationOptions,
    sort: AuditLogSort,
  ): Promise<PaginatedResult<IAuditLog>> {
    const query = withActiveFilter(this.buildFilterQuery(filters));
    const pageOptions = getPagination(pagination);
    const sortOrder = sort.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ [sort.sortBy]: sortOrder })
        .skip(pageOptions.skip)
        .limit(pageOptions.limit)
        .exec(),
      AuditLog.countDocuments(query).exec(),
    ]);

    return {
      items,
      meta: buildPaginationMeta(total, pageOptions),
    };
  }
}

export const auditLogRepository = new AuditLogRepository();
