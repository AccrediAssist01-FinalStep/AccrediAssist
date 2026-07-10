import { FilterQuery } from 'mongoose';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { BaseRepository, PaginatedResult } from './base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import {
  IFacultyAchievement,
  FacultyAchievementFilters,
  FacultyAchievementSort,
} from '../types/facultyAchievement.types';

export class FacultyAchievementRepository extends BaseRepository<IFacultyAchievement> {
  constructor() {
    super(FacultyAchievement);
  }

  private buildFilterQuery(filters: FacultyAchievementFilters = {}): FilterQuery<IFacultyAchievement> {
    const query: FilterQuery<IFacultyAchievement> = {};

    if (filters.facultyName) {
      query.facultyName = { $regex: filters.facultyName, $options: 'i' };
    }

    if (filters.designation) {
      query.designation = { $regex: filters.designation, $options: 'i' };
    }

    if (filters.achievementType) {
      query.achievementType = filters.achievementType;
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
        { facultyName: searchRegex },
        { designation: searchRegex },
        { title: searchRegex },
        { organization: searchRegex },
        { description: searchRegex },
      ];
    }

    return query;
  }

  async findWithFilters(
    filters: FacultyAchievementFilters = {},
    pagination: PaginationOptions,
    sort: FacultyAchievementSort,
  ): Promise<PaginatedResult<IFacultyAchievement>> {
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

export const facultyAchievementRepository = new FacultyAchievementRepository();
