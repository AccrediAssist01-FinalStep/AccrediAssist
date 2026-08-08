import mongoose, { Schema } from 'mongoose';
import { IPendingRecord } from '../types/pendingRecord.types';
import {
  applyBaseSchema,
  baseSchemaOptions,
  enumField,
  PENDING_RECORD_STATUSES,
  RECORD_CATEGORIES,
} from '../database';

const editHistoryEntrySchema = new Schema(
  {
    editedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    editedAt: {
      type: Date,
      required: true,
    },
    changes: [
      {
        field: {
          type: String,
          required: true,
          trim: true,
        },
        previousValue: {
          type: Schema.Types.Mixed,
        },
        newValue: {
          type: Schema.Types.Mixed,
        },
      },
    ],
    previousConfidenceScore: Number,
    newConfidenceScore: Number,
  },
  { _id: false },
);

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
    whatsappMessageId: {
      type: String,
      trim: true,
      maxlength: [200, 'WhatsApp message id cannot exceed 200 characters'],
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
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Rejection reason cannot exceed 1000 characters'],
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    approvedRecordId: {
      type: Schema.Types.ObjectId,
    },
    approvedTargetModule: {
      type: String,
      trim: true,
    },
    editHistory: {
      type: [editHistoryEntrySchema],
      default: [],
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
pendingRecordSchema.index(
  { whatsappMessageId: 1 },
  { unique: true, sparse: true, name: 'whatsapp_message_id_unique' },
);

export const PendingRecord = mongoose.model<IPendingRecord>(
  'PendingRecord',
  pendingRecordSchema,
);
