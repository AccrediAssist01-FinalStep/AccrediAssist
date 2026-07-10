import mongoose, { Schema } from 'mongoose';
import { INotification } from '../types/notification.types';
import {
  applyBaseSchema,
  baseSchemaOptions,
  enumField,
  NOTIFICATION_TYPES,
} from '../database';

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: enumField(NOTIFICATION_TYPES, 'notification type'),
      required: [true, 'Notification type is required'],
    },
  },
  {
    ...baseSchemaOptions,
    collection: 'notifications',
  },
);

applyBaseSchema(notificationSchema);

notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
