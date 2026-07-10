import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { publicationService } from '../services/publication.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { PublicationListQuery } from '../validations/publication.validation';

class PublicationController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PublicationListQuery;

    const result = await publicationService.listPublications(
      {
        search: query.search,
        facultyName: query.facultyName,
        journal: query.journal,
        conference: query.conference,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
      { page: query.page, limit: query.limit },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
    );

    this.paginated(res, 'Publications retrieved successfully', result.items, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await publicationService.getById(req.params.id);
    this.success(res, 'Publication retrieved successfully', record);
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await publicationService.createPublication(req.body, userId);
    this.created(res, 'Publication created successfully', record);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await publicationService.updatePublication(req.params.id, req.body, userId);
    this.success(res, 'Publication updated successfully', record);
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    await publicationService.deletePublication(req.params.id, userId);
    this.success(res, 'Publication deleted successfully');
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const publicationController = new PublicationController();
