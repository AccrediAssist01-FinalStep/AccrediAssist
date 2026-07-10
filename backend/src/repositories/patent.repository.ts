import { FilterQuery } from 'mongoose';
import { Patent } from '../models/Patent';
import { BaseRepository, PaginatedResult } from './base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import { IPatent, PatentFilters, PatentSort } from '../types/patent.types';

export class PatentRepository extends BaseRepository<IPatent> {
  constructor() {
    super(Patent);
  }

  private buildFilterQuery(filters: PatentFilters = {}): FilterQuery<IPatent> {
    const query: FilterQuery<IPatent> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.patentNumber) {
      query.patentNumber = { $regex: filters.patentNumber, $options: 'i' };
    }

    if (filters.fromDate || filters.toDate) {
      query.filingDate = {};
      if (filters.fromDate) {
        query.filingDate.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.filingDate.$lte = filters.toDate;
      }
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { patentTitle: searchRegex },
        { patentNumber: searchRegex },
        { inventors: searchRegex },
      ];
    }

    return query;
  }

  async findWithFilters(
    filters: PatentFilters = {},
    pagination: PaginationOptions,
    sort: PatentSort,
  ): Promise<PaginatedResult<IPatent>> {
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

export const patentRepository = new PatentRepository();
