import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { auditLogService } from '../services/auditLog.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuditLogListQuery } from '../validations/auditLog.validation';

class AuditLogController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as AuditLogListQuery;

    const result = await auditLogService.listAuditLogs(
      {
        userId: query.userId,
        module: query.module,
        action: query.action,
        search: query.search,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
      { page: query.page, limit: query.limit },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
    );

    this.paginated(res, 'Audit logs retrieved successfully', result.items, result.meta);
  });
}

export const auditLogController = new AuditLogController();
