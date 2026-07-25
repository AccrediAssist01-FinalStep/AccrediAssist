import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { searchService } from '../search/services/search.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { SearchListQuery, SearchExecuteBody, SearchRequestBody } from '../validations/search.validation';

class SearchController extends BaseController {
  status = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    this.success(res, 'Smart search module status retrieved successfully', searchService.getModuleStatus());
  });

  collections = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    this.success(res, 'Supported search collections retrieved successfully', {
      collections: searchService.getSupportedCollections(),
    });
  });

  search = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const body = req.body as SearchRequestBody;

    const result = await searchService.search(
      {
        query: body.query,
        department: body.department,
        collection: body.collection,
      },
      userId,
    );

    this.success(res, 'Search completed successfully', result);
  });

  searchByQuery = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const query = req.query as unknown as SearchListQuery;

    const result = await searchService.search(
      {
        query: query.query,
        department: query.department,
        collection: query.collection,
      },
      userId,
    );

    this.success(res, 'Search completed successfully', result);
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
        pagination: {
          page: body.page,
          limit: body.limit,
        },
      },
      userId,
    );

    this.success(res, 'Search executed successfully', result);
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    return req.user.id;
  }
}

export const searchController = new SearchController();
