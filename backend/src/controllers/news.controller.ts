import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { newsService } from '../services/news.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { NewsListQuery } from '../validations/news.validation';

class NewsController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as NewsListQuery;
    const result = await newsService.listNews(
      {
        search: query.search,
        articleCategory: query.articleCategory,
        articleLanguage: query.articleLanguage,
        newspaperName: query.newspaperName,
        department: query.department,
        fromDate: query.fromDate?.toISOString(),
        toDate: query.toDate?.toISOString(),
      },
      { page: query.page, limit: query.limit },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
    );
    this.paginated(res, 'News articles retrieved successfully', result.items, result.meta);
  });

  dashboard = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await newsService.getDashboardStats();
    this.success(res, 'News dashboard stats retrieved successfully', stats);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await newsService.getById(req.params.id);
    this.success(res, 'News article retrieved successfully', record);
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await newsService.createNews(req.body, userId);
    this.created(res, 'News article created successfully', record);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await newsService.updateNews(req.params.id, req.body, userId);
    this.success(res, 'News article updated successfully', record);
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    await newsService.deleteNews(req.params.id, userId);
    this.success(res, 'News article deleted successfully');
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const newsController = new NewsController();
