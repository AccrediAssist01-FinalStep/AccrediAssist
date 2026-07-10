import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';

export interface IAuditLog extends IBaseDocument {
  userId?: Types.ObjectId;
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
  timestamp: Date;
}

export interface CreateAuditLogInput {
  userId?: Types.ObjectId | string;
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
  timestamp?: Date;
}

export interface IAuditLogResponse {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogFilters {
  userId?: string;
  module?: string;
  action?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface AuditLogSort {
  sortBy: 'timestamp' | 'module' | 'action' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
