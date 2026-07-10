import { Types } from 'mongoose';
import { NotificationType } from '../database/enums';
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
