import { notificationRepository } from '../repositories/notification.repository';
import {
  INotificationResponse,
  NotificationFilters,
  NotificationListResult,
  NotificationSort,
} from '../types/notification.types';
import { toNotificationResponse } from '../utils/notification.mapper';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { NotFoundError } from '../utils/errors';

export class NotificationService {
  async listForUser(
    userId: string,
    filters: NotificationFilters,
    pagination: PaginationOptions,
    sort: NotificationSort,
  ): Promise<NotificationListResult> {
    logger.info('Listing notifications for user', { userId, filters, pagination, sort });

    const [result, unreadCount] = await Promise.all([
      notificationRepository.findForUser(userId, filters, pagination, sort),
      notificationRepository.countUnreadForUser(userId),
    ]);

    return {
      items: result.items.map((record) => toNotificationResponse(record)),
      meta: {
        ...result.meta,
        unreadCount,
      },
    };
  }

  async markAsRead(id: string, userId: string): Promise<INotificationResponse> {
    logger.info('Marking notification as read', { notificationId: id, userId });

    const updated = await notificationRepository.markAsReadForUser(id, userId);
    if (!updated) {
      throw new NotFoundError('Notification not found');
    }

    return toNotificationResponse(updated);
  }
}

export const notificationService = new NotificationService();
