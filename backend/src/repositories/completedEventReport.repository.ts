import { FilterQuery } from 'mongoose';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { BaseRepository, PaginatedResult } from './base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import {
  CompletedEventReportFilters,
  CompletedEventReportSort,
  ICompletedEventReport,
} from '../types/completedEventReport.types';

export class CompletedEventReportRepository extends BaseRepository<ICompletedEventReport> {
  constructor() {
    super(CompletedEventReport);
  }

  private buildFilterQuery(
    filters: CompletedEventReportFilters = {},
  ): FilterQuery<ICompletedEventReport> {
    const query: FilterQuery<ICompletedEventReport> = {};

    if (filters.eventType) {
      query.eventType = filters.eventType;
    }

    if (filters.eventTitle) {
      query.eventTitle = { $regex: filters.eventTitle, $options: 'i' };
    }

    if (filters.coordinator) {
      query.coordinator = { $regex: filters.coordinator, $options: 'i' };
    }

    if (filters.fromDate || filters.toDate) {
      query.date = {};
      if (filters.fromDate) {
        query.date.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.date.$lte = filters.toDate;
      }
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { eventTitle: searchRegex },
        { venue: searchRegex },
        { coordinator: searchRegex },
        { summary: searchRegex },
        { description: searchRegex },
      ];
    }

    return query;
  }

  async findWithFilters(
    filters: CompletedEventReportFilters = {},
    pagination: PaginationOptions,
    sort: CompletedEventReportSort,
  ): Promise<PaginatedResult<ICompletedEventReport>> {
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
}

export const completedEventReportRepository = new CompletedEventReportRepository();
