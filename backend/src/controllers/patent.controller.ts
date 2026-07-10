import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { patentService } from '../services/patent.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { PatentListQuery } from '../validations/patent.validation';

class PatentController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PatentListQuery;

    const result = await patentService.listPatents(
      {
        search: query.search,
        status: query.status,
        patentNumber: query.patentNumber,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
      { page: query.page, limit: query.limit },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
    );

    this.paginated(res, 'Patents retrieved successfully', result.items, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await patentService.getById(req.params.id);
    this.success(res, 'Patent retrieved successfully', record);
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await patentService.createPatent(req.body, userId);
    this.created(res, 'Patent created successfully', record);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await patentService.updatePatent(req.params.id, req.body, userId);
    this.success(res, 'Patent updated successfully', record);
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    await patentService.deletePatent(req.params.id, userId);
    this.success(res, 'Patent deleted successfully');
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const patentController = new PatentController();
