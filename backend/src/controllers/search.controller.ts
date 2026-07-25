import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { searchService } from '../search/services/search.service';
import { searchHistoryService } from '../search/services/search-history.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { SearchListQuery, SearchExecuteBody, SearchRequestBody, SearchHistoryListQuery } from '../validations/search.validation';

const parseFields = (value?: string | string[]): string[] | undefined => {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => entry.trim()).filter(Boolean);
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

class SearchController extends BaseController {
  status = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    this.success(res, 'Smart search module status retrieved successfully', searchService.getModuleStatus());
  });

  collections = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    this.success(res, 'Supported search collections retrieved successfully', {
      collections: searchService.getSupportedCollections(),
    });
  });

  globalSearch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const body = req.body as SearchRequestBody;

    const result = await searchService.globalSearch(
      {
        query: body.query,
        department: body.department,
        collection: body.collection,
        filters: body.filters,
        sort: body.sort,
        page: body.page,
        limit: body.limit,
        fields: body.fields,
      },
      userId,
    );

    this.success(res, 'Global search completed successfully', result);
  });

  searchByQuery = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const queryParams = req.query as unknown as SearchListQuery;

    const result = await searchService.globalSearch(
      {
        query: queryParams.query,
        department: queryParams.department,
        collection: queryParams.collection,
        page: queryParams.page,
        limit: queryParams.limit,
        fields: parseFields(queryParams.fields),
      },
      userId,
    );

    this.success(res, 'Global search completed successfully', result);
  });

  execute = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const body = req.body as SearchExecuteBody;

    const result = await searchService.executeStructuredSearch(
      {
        collection: body.collection,
        filters: body.filters,
        sort: body.sort,
        department: body.department,
        fields: body.fields,
        page: body.page,
        limit: body.limit,
      },
      userId,
    );

    this.success(res, 'Search executed successfully', result);
  });

  getHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const query = req.query as unknown as SearchHistoryListQuery;

    const result = await searchHistoryService.getHistory(userId, {
      page: query.page,
      limit: query.limit,
    });

    this.paginated(res, 'Search history retrieved successfully', result.items, result.meta);
  });

  clearHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const result = await searchHistoryService.clearHistory(userId);

    this.success(res, 'Search history cleared successfully', result);
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    return req.user.id;
  }
}

export const searchController = new SearchController();
