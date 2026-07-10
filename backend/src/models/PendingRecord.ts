import mongoose, { Schema } from 'mongoose';
import { IPendingRecord } from '../types/pendingRecord.types';
import {
  applyBaseSchema,
  baseSchemaOptions,
  enumField,
  PENDING_RECORD_STATUSES,
  RECORD_CATEGORIES,
} from '../database';

const pendingRecordSchema = new Schema<IPendingRecord>(
  {
    originalMessage: {
      type: String,
      required: [true, 'Original message is required'],
      trim: true,
      maxlength: [5000, 'Original message cannot exceed 5000 characters'],
    },
    groupName: {
      type: String,
      trim: true,
      maxlength: [200, 'Group name cannot exceed 200 characters'],
    },
    senderName: {
      type: String,
      trim: true,
      maxlength: [100, 'Sender name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: enumField(RECORD_CATEGORIES, 'category'),
      required: [true, 'Category is required'],
    },
    extractedData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    confidenceScore: {
      type: Number,
      required: [true, 'Confidence score is required'],
      min: [0, 'Confidence score cannot be less than 0'],
      max: [100, 'Confidence score cannot exceed 100'],
      default: 0,
    },
    status: {
      type: String,
      enum: enumField(PENDING_RECORD_STATUSES, 'status'),
      default: 'Pending',
      required: [true, 'Status is required'],
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    ...baseSchemaOptions,
    collection: 'pending_records',
  },
);

applyBaseSchema(pendingRecordSchema);

pendingRecordSchema.index({ status: 1 });
pendingRecordSchema.index({ category: 1 });
pendingRecordSchema.index({ createdAt: -1 });
pendingRecordSchema.index({ confidenceScore: 1 });

export const PendingRecord = mongoose.model<IPendingRecord>(
  'PendingRecord',
  pendingRecordSchema,
);
