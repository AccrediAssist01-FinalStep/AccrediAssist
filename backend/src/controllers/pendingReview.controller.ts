import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { pendingReviewService } from '../services/pendingReview.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { PendingRecordListQuery } from '../validations/pendingRecord.validation';

class PendingReviewController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PendingRecordListQuery;

    const result = await pendingReviewService.getAllPendingRecords({
      search: query.search,
      title: query.title,
      status: query.status,
      category: query.category,
      groupName: query.groupName,
      senderName: query.senderName,
      pagination: {
        page: query.page,
        limit: query.limit,
      },
      sort: {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });

    this.paginated(res, 'Pending records retrieved successfully', result.items, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await pendingReviewService.getPendingRecordById(req.params.id);
    this.success(res, 'Pending record retrieved successfully', record);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await pendingReviewService.updatePendingRecord(req.params.id, req.body);
    this.success(res, 'Pending record updated successfully', record);
  });
}

export const pendingReviewController = new PendingReviewController();
