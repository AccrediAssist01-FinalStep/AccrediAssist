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
      maxlength: [100, 'Action cannot exceed 100 characters'],
    },
    module: {
      type: String,
      required: [true, 'Module is required'],
      trim: true,
      maxlength: [100, 'Module cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: [45, 'IP address cannot exceed 45 characters'],
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
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
