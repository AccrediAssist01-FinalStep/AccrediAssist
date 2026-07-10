import { FilterQuery, Types } from 'mongoose';
import { Report } from '../models/Report';
import { BaseRepository, PaginatedResult } from './base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import { IReport, ReportFilters, ReportSort } from '../types/report.types';

export class ReportRepository extends BaseRepository<IReport> {
  constructor() {
    super(Report);
  }

  private buildFilterQuery(filters: ReportFilters = {}): FilterQuery<IReport> {
    const query: FilterQuery<IReport> = {};

    if (filters.reportType) {
      query.reportType = filters.reportType;
    }

    if (filters.generatedBy) {
      query.generatedBy = new Types.ObjectId(filters.generatedBy);
    }

    if (filters.fromDate || filters.toDate) {
      query.generatedDate = {};
      if (filters.fromDate) {
        query.generatedDate.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.generatedDate.$lte = filters.toDate;
      }
    }

    if (filters.search) {
      query.reportTitle = { $regex: filters.search, $options: 'i' };
    }

    return query;
  }

  async findWithFilters(
    filters: ReportFilters = {},
    pagination: PaginationOptions,
    sort: ReportSort,
  ): Promise<PaginatedResult<IReport>> {
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

export const reportRepository = new ReportRepository();
