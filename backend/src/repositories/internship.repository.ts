import { FilterQuery } from 'mongoose';
import { Internship } from '../models/Internship';
import { BaseRepository, PaginatedResult } from './base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import { IInternship, InternshipFilters, InternshipSort } from '../types/internship.types';

export class InternshipRepository extends BaseRepository<IInternship> {
  constructor() {
    super(Internship);
  }

  private buildFilterQuery(filters: InternshipFilters = {}): FilterQuery<IInternship> {
    const query: FilterQuery<IInternship> = {};

    if (filters.company) {
      query.company = { $regex: filters.company, $options: 'i' };
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { studentName: searchRegex },
        { rollNumber: searchRegex },
        { company: searchRegex },
        { role: searchRegex },
        { duration: searchRegex },
      ];
    }

    return query;
  }

  async findWithFilters(
    filters: InternshipFilters = {},
    pagination: PaginationOptions,
    sort: InternshipSort,
  ): Promise<PaginatedResult<IInternship>> {
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

export const internshipRepository = new InternshipRepository();
