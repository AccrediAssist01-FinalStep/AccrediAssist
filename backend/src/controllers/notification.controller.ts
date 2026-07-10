import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { notificationService } from '../services/notification.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { NotificationListQuery } from '../validations/notification.validation';

class NotificationController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const query = req.query as unknown as NotificationListQuery;

    const result = await notificationService.listForUser(
      userId,
      {
        isRead: query.isRead,
        type: query.type,
      },
      { page: query.page, limit: query.limit },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
    );

    this.success(res, 'Notifications retrieved successfully', result);
  });

  markAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const notification = await notificationService.markAsRead(req.params.id, userId);
    this.success(res, 'Notification marked as read', notification);
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const notificationController = new NotificationController();
