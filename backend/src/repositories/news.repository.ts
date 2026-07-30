import { FilterQuery } from 'mongoose';
import { News } from '../models/News';
import { BaseRepository, PaginatedResult } from './base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import { INews, NewsFilters, NewsSort } from '../types/news.types';

export class NewsRepository extends BaseRepository<INews> {
  constructor() {
    super(News);
  }

  private buildFilterQuery(filters: NewsFilters = {}): FilterQuery<INews> {
    const query: FilterQuery<INews> = {};

    if (filters.articleCategory) {
      query.articleCategory = filters.articleCategory;
    }

    if (filters.articleLanguage) {
      query.articleLanguage = { $regex: filters.articleLanguage, $options: 'i' };
    }

    if (filters.newspaperName) {
      query.newspaperName = { $regex: filters.newspaperName, $options: 'i' };
    }

    if (filters.department) {
      query.department = { $regex: filters.department, $options: 'i' };
    }

    if (filters.fromDate || filters.toDate) {
      query.publicationDate = {};
      if (filters.fromDate) {
        query.publicationDate.$gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        query.publicationDate.$lte = new Date(filters.toDate);
      }
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { headline: searchRegex },
        { articleText: searchRegex },
        { newspaperName: searchRegex },
        { summary: searchRegex },
        { peopleMentioned: searchRegex },
        { organization: searchRegex },
        { department: searchRegex },
      ];
    }

    return query;
  }

  async findWithFilters(
    filters: NewsFilters = {},
    pagination: PaginationOptions,
    sort: NewsSort,
  ): Promise<PaginatedResult<INews>> {
    const query = withActiveFilter(this.buildFilterQuery(filters));
    const pageOptions = getPagination(pagination);
    const sortBy = sort.sortBy ?? 'createdAt';
    const sortOrder = sort.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ [sortBy]: sortOrder })
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

  async countByCategory(): Promise<Record<string, number>> {
    const rows = await this.model.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$articleCategory', count: { $sum: 1 } } },
    ]);

    return Object.fromEntries(rows.map((row) => [row._id, row.count]));
  }

  async countMonthly(year: number): Promise<Array<{ month: string; count: number }>> {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const rows = await this.model.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return rows.map((row) => ({
      month: monthNames[(row._id as number) - 1] ?? String(row._id),
      count: row.count as number,
    }));
  }
}

export const newsRepository = new NewsRepository();
