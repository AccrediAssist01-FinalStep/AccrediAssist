import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { pendingRecordService } from '../services/pendingRecord.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { PendingRecordListQuery } from '../validations/pendingRecord.validation';

class PendingRecordController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PendingRecordListQuery;

    const result = await pendingRecordService.listPendingRecords(
      {
        status: query.status,
        category: query.category,
        groupName: query.groupName,
        senderName: query.senderName,
      },
      { page: query.page, limit: query.limit },
    );

    this.paginated(res, 'Pending records retrieved successfully', result.items, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await pendingRecordService.getById(req.params.id);
    this.success(res, 'Pending record retrieved successfully', record);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await pendingRecordService.updatePendingRecord(
      req.params.id,
      req.body,
      userId,
    );
    this.success(res, 'Pending record updated successfully', record);
  });

  approve = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await pendingRecordService.approvePendingRecord(req.params.id, userId);
    this.success(res, 'Pending record approved successfully', record);
  });

  reject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await pendingRecordService.rejectPendingRecord(
      req.params.id,
      userId,
      req.body,
    );
    this.success(res, 'Pending record rejected successfully', record);
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const pendingRecordController = new PendingRecordController();
