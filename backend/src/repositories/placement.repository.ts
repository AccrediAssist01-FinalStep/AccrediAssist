import { FilterQuery } from 'mongoose';
import { Placement } from '../models/Placement';
import { BaseRepository, PaginatedResult } from './base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import { IPlacement, PlacementFilters, PlacementSort } from '../types/placement.types';

export class PlacementRepository extends BaseRepository<IPlacement> {
  constructor() {
    super(Placement);
  }

  private buildFilterQuery(filters: PlacementFilters = {}): FilterQuery<IPlacement> {
    const query: FilterQuery<IPlacement> = {};

    if (filters.company) {
      query.company = { $regex: filters.company, $options: 'i' };
    }

    if (filters.department) {
      query.department = { $regex: filters.department, $options: 'i' };
    }

    if (filters.fromDate || filters.toDate) {
      query.joiningDate = {};
      if (filters.fromDate) {
        query.joiningDate.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.joiningDate.$lte = filters.toDate;
      }
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { studentName: searchRegex },
        { rollNumber: searchRegex },
        { department: searchRegex },
        { company: searchRegex },
        { role: searchRegex },
        { package: searchRegex },
      ];
    }

    return query;
  }

  async findWithFilters(
    filters: PlacementFilters = {},
    pagination: PaginationOptions,
    sort: PlacementSort,
  ): Promise<PaginatedResult<IPlacement>> {
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

export const placementRepository = new PlacementRepository();
