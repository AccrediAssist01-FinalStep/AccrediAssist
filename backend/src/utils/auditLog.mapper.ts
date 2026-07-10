import { IAuditLog, IAuditLogResponse } from '../types/auditLog.types';

export const toAuditLogResponse = (record: IAuditLog): IAuditLogResponse => ({
  _id: record._id,
  userId: record.userId,
  action: record.action,
  module: record.module,
  description: record.description,
  ipAddress: record.ipAddress,
  timestamp: record.timestamp,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
