import mongoose, { Schema } from 'mongoose';
import { IAuditLog } from '../types/auditLog.types';
import { applyBaseSchema, baseSchemaOptions } from '../database';

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    module: {
      type: String,
      required: [true, 'Module is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    relatedRecordId: {
      type: Schema.Types.ObjectId,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    ...baseSchemaOptions,
    collection: 'audit_logs',
  },
);

applyBaseSchema(auditLogSchema);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ module: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
