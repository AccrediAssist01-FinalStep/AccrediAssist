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
