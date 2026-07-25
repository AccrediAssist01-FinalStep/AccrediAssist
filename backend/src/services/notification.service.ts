import { notificationRepository } from '../repositories/notification.repository';
import { userRepository } from '../repositories/user.repository';
import {
  CreateNotificationInput,
  INotificationResponse,
  NotificationFilters,
  NotificationListResult,
  NotificationSort,
} from '../types/notification.types';
import { IPendingRecordResponse } from '../types/pendingRecord.types';
import {
  buildPendingRecordApprovedNotification,
  buildPendingRecordCreatedNotification,
  buildPendingRecordRejectedNotification,
  toObjectId,
} from '../utils/pendingRecordNotification.util';
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

  async createNotification(input: CreateNotificationInput): Promise<INotificationResponse> {
    const created = await notificationRepository.create({
      title: input.title,
      message: input.message,
      userId: input.userId,
      type: input.type,
      isRead: input.isRead ?? false,
    });

    return toNotificationResponse(created);
  }

  async notifyFaculty(
    payload: Pick<CreateNotificationInput, 'title' | 'message' | 'type'>,
  ): Promise<INotificationResponse[]> {
    const facultyUserIds = await userRepository.findIdsByRole('Faculty');

    if (facultyUserIds.length === 0) {
      logger.warn('No faculty users found for notification delivery');
      return [];
    }

    const notifications = await Promise.all(
      facultyUserIds.map((userId) =>
        this.createNotification({
          ...payload,
          userId: toObjectId(userId),
        }),
      ),
    );

    logger.info('Faculty notifications created', {
      type: payload.type,
      recipientCount: notifications.length,
    });

    return notifications;
  }

  async notifyFacultyPendingRecordCreated(record: IPendingRecordResponse): Promise<void> {
    await this.notifyFaculty(buildPendingRecordCreatedNotification(record));
  }

  async notifyFacultyPendingRecordApproved(record: IPendingRecordResponse): Promise<void> {
    await this.notifyFaculty(buildPendingRecordApprovedNotification(record));
  }

  async notifyFacultyPendingRecordRejected(record: IPendingRecordResponse): Promise<void> {
    await this.notifyFaculty(buildPendingRecordRejectedNotification(record));
  }

  async safelyNotify(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (error) {
      logger.warn('Failed to deliver faculty notification', { error });
    }
  }
}

export const notificationService = new NotificationService();
