import { NotFoundError } from '../utils/errors';
import { newsRepository } from '../repositories/news.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { BaseService } from './base.service';
import {
  CreateNewsInput,
  INews,
  INewsResponse,
  NewsDashboardStats,
  NewsFilters,
  NewsSort,
  UpdateNewsInput,
} from '../types/news.types';
import { toNewsResponse } from '../utils/news.mapper';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';
import { CreateNewsBody, UpdateNewsBody } from '../validations/news.validation';
import { pendingRecordRepository } from '../repositories/pendingRecord.repository';

export class NewsService extends BaseService<INews, INewsResponse, CreateNewsInput, UpdateNewsInput> {
  constructor() {
    super(newsRepository);
  }

  protected toResponse(document: INews): INewsResponse {
    return toNewsResponse(document);
  }

  protected buildCreateData(input: CreateNewsBody): Partial<INews> {
    return {
      ...input,
      peopleMentioned: input.peopleMentioned ?? [],
    };
  }

  protected buildUpdateData(input: UpdateNewsBody): Partial<INews> {
    return input;
  }

  async listNews(
    filters: NewsFilters,
    pagination: PaginationOptions,
    sort: NewsSort,
  ): Promise<PaginatedResult<INewsResponse>> {
    logger.info('Listing news articles', { filters, pagination, sort });
    const result = await newsRepository.findWithFilters(filters, pagination, sort);
    return {
      items: result.items.map((record) => this.toResponse(record)),
      meta: result.meta,
    };
  }

  async getById(id: string): Promise<INewsResponse> {
    const record = await newsRepository.findById(id);
    if (!record) {
      throw new NotFoundError('News article not found');
    }
    return this.toResponse(record);
  }

  async createNews(input: CreateNewsBody, userId: string): Promise<INewsResponse> {
    const created = await newsRepository.create(this.buildCreateData(input));
    await auditLogRepository.create({
      userId,
      action: 'CREATE',
      module: 'News',
      description: `Created news article ${created._id}`,
    });
    return this.toResponse(created);
  }

  async updateNews(id: string, input: UpdateNewsBody, userId: string): Promise<INewsResponse> {
    const updated = await newsRepository.update(id, this.buildUpdateData(input), userId);
    if (!updated) {
      throw new NotFoundError('News article not found');
    }
    await auditLogRepository.create({
      userId,
      action: 'UPDATE',
      module: 'News',
      description: `Updated news article ${id}`,
    });
    return this.toResponse(updated);
  }

  async deleteNews(id: string, userId: string): Promise<void> {
    const deleted = await newsRepository.softDelete(id, userId);
    if (!deleted) {
      throw new NotFoundError('News article not found');
    }
    await auditLogRepository.create({
      userId,
      action: 'DELETE',
      module: 'News',
      description: `Deleted news article ${id}`,
    });
  }

  async getDashboardStats(): Promise<NewsDashboardStats> {
    const year = new Date().getFullYear();
    const monthStart = new Date(year, new Date().getMonth(), 1);

    const [totalArticles, categoryCounts, monthlyAnalytics, recentResult, pendingReviews, monthlyCount] =
      await Promise.all([
        newsRepository.count({ isDeleted: { $ne: true } }),
        newsRepository.countByCategory(),
        newsRepository.countMonthly(year),
        newsRepository.findWithFilters({}, { page: 1, limit: 6 }, { sortBy: 'createdAt', sortOrder: 'desc' }),
        pendingRecordRepository.count({ category: 'News', status: { $in: ['Pending', 'Needs Review'] } }),
        newsRepository.count({
          isDeleted: { $ne: true },
          createdAt: { $gte: monthStart },
        }),
      ]);

    const aiInsights = [
      `Total of ${totalArticles} newspaper articles archived in the system.`,
      `${categoryCounts['Student News'] ?? 0} student-focused news articles detected.`,
      `${categoryCounts['Faculty News'] ?? 0} faculty-focused news articles detected.`,
      `${categoryCounts['Department News'] ?? 0} department-focused news articles detected.`,
      `${pendingReviews} news articles awaiting faculty review.`,
    ];

    return {
      totalArticles,
      pendingReviews,
      studentNews: categoryCounts['Student News'] ?? 0,
      facultyNews: categoryCounts['Faculty News'] ?? 0,
      departmentNews: categoryCounts['Department News'] ?? 0,
      monthlyCount,
      recentArticles: recentResult.items.map((item) => toNewsResponse(item)),
      monthlyAnalytics,
      aiInsights,
    };
  }
}

export const newsService = new NewsService();
