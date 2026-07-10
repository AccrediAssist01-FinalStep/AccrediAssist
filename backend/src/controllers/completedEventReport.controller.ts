import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { completedEventReportService } from '../services/completedEventReport.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { CompletedEventReportListQuery } from '../validations/completedEventReport.validation';

class CompletedEventReportController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as CompletedEventReportListQuery;

    const result = await completedEventReportService.listCompletedEventReports(
      {
        search: query.search,
        eventType: query.eventType,
        eventTitle: query.eventTitle,
        coordinator: query.coordinator,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
      { page: query.page, limit: query.limit },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
    );

    this.paginated(res, 'Event reports retrieved successfully', result.items, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await completedEventReportService.getById(req.params.id);
    this.success(res, 'Event report retrieved successfully', record);
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await completedEventReportService.createCompletedEventReport(
      req.body,
      userId,
    );
    this.created(res, 'Event report created successfully', record);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await completedEventReportService.updateCompletedEventReport(
      req.params.id,
      req.body,
      userId,
    );
    this.success(res, 'Event report updated successfully', record);
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    await completedEventReportService.deleteCompletedEventReport(req.params.id, userId);
    this.success(res, 'Event report deleted successfully');
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const completedEventReportController = new CompletedEventReportController();
