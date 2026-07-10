import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { internshipService } from '../services/internship.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { InternshipListQuery } from '../validations/internship.validation';

class InternshipController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as InternshipListQuery;

    const result = await internshipService.listInternships(
      {
        search: query.search,
        company: query.company,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
      { page: query.page, limit: query.limit },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
    );

    this.paginated(res, 'Internships retrieved successfully', result.items, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await internshipService.getById(req.params.id);
    this.success(res, 'Internship retrieved successfully', record);
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await internshipService.createInternship(req.body, userId);
    this.created(res, 'Internship created successfully', record);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await internshipService.updateInternship(req.params.id, req.body, userId);
    this.success(res, 'Internship updated successfully', record);
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    await internshipService.deleteInternship(req.params.id, userId);
    this.success(res, 'Internship deleted successfully');
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const internshipController = new InternshipController();
