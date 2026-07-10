import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { reportService } from '../services/report.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { ReportDownloadQuery, ReportListQuery } from '../validations/report.validation';

class ReportController extends BaseController {
  generate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const report = await reportService.generateReport(req.body, userId);
    this.created(res, 'Report generation request accepted', report);
  });

  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as ReportListQuery;

    const result = await reportService.listReports(
      {
        search: query.search,
        reportType: query.reportType,
        generatedBy: query.generatedBy,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
      { page: query.page, limit: query.limit },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
    );

    this.paginated(res, 'Report history retrieved successfully', result.items, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const report = await reportService.getReportById(req.params.id);
    this.success(res, 'Report retrieved successfully', report);
  });

  download = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as ReportDownloadQuery;
    const downloadInfo = await reportService.getDownloadInfo(req.params.id);

    if (query.redirect) {
      res.redirect(302, downloadInfo.downloadUrl);
      return;
    }

    this.success(res, 'Report download details retrieved successfully', downloadInfo);
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const reportController = new ReportController();
