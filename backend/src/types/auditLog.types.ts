import { Document, Types } from 'mongoose';
import { IBaseDocument } from '../types/base.types';

export interface IAuditLog extends IBaseDocument {
  userId?: Types.ObjectId;
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
  relatedRecordId?: Types.ObjectId;
  timestamp: Date;
}

export interface CreateAuditLogInput {
  userId?: string;
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
  relatedRecordId?: string;
}
