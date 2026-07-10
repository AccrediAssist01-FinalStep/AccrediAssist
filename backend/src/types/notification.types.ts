import { Types } from 'mongoose';
import { NotificationType } from '../database/enums';
import { PaginationMeta } from './api.types';
import { IBaseDocument } from './base.types';

export interface INotification extends IBaseDocument {
  title: string;
  message: string;
  userId: Types.ObjectId;
  isRead: boolean;
  type: NotificationType;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  userId: Types.ObjectId;
  isRead?: boolean;
  type: NotificationType;
}

export interface UpdateNotificationInput {
  title?: string;
  message?: string;
  userId?: Types.ObjectId;
  isRead?: boolean;
  type?: NotificationType;
}

export interface INotificationResponse {
  _id: Types.ObjectId;
  title: string;
  message: string;
  userId: Types.ObjectId;
  isRead: boolean;
  type: NotificationType;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationFilters {
  search?: string;
  isRead?: boolean;
  type?: NotificationType;
}

export interface NotificationSort {
  sortBy: 'createdAt' | 'title' | 'type';
  sortOrder: 'asc' | 'desc';
}

export interface NotificationListResult {
  items: INotificationResponse[];
  meta: PaginationMeta;
}
