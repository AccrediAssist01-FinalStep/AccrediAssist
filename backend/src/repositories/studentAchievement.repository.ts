import { FilterQuery } from 'mongoose';
import { StudentAchievement } from '../models/StudentAchievement';
import { BaseRepository, PaginatedResult } from './base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import {
  IStudentAchievement,
  StudentAchievementFilters,
  StudentAchievementSort,
} from '../types/studentAchievement.types';

export class StudentAchievementRepository extends BaseRepository<IStudentAchievement> {
  constructor() {
    super(StudentAchievement);
  }

  private buildFilterQuery(filters: StudentAchievementFilters = {}): FilterQuery<IStudentAchievement> {
    const query: FilterQuery<IStudentAchievement> = {};

    if (filters.studentName) {
      query.studentName = { $regex: filters.studentName, $options: 'i' };
    }

    if (filters.department) {
      query.department = { $regex: filters.department, $options: 'i' };
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
        { studentName: searchRegex },
        { rollNumber: searchRegex },
        { title: searchRegex },
        { organization: searchRegex },
        { description: searchRegex },
        { department: searchRegex },
      ];
    }

    return query;
  }

  async findWithFilters(
    filters: StudentAchievementFilters = {},
    pagination: PaginationOptions,
    sort: StudentAchievementSort,
  ): Promise<PaginatedResult<IStudentAchievement>> {
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

export const studentAchievementRepository = new StudentAchievementRepository();
