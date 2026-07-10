import { INotification, INotificationResponse } from '../types/notification.types';

export const toNotificationResponse = (record: INotification): INotificationResponse => ({
  _id: record._id,
  title: record.title,
  message: record.message,
  userId: record.userId,
  isRead: record.isRead,
  type: record.type,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
