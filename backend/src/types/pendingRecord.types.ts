import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';
import { PendingRecordStatus, RecordCategory } from '../database/enums';

export interface IPendingRecord extends IBaseDocument {
  originalMessage: string;
  groupName?: string;
  senderName?: string;
  category: RecordCategory;
  extractedData?: Record<string, unknown>;
  confidenceScore: number;
  status: PendingRecordStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
}

export interface CreatePendingRecordInput {
  originalMessage: string;
  groupName?: string;
  senderName?: string;
  category: RecordCategory;
  extractedData?: Record<string, unknown>;
  confidenceScore?: number;
  status?: PendingRecordStatus;
}

export interface UpdatePendingRecordInput {
  originalMessage?: string;
  groupName?: string;
  senderName?: string;
  category?: RecordCategory;
  extractedData?: Record<string, unknown>;
  confidenceScore?: number;
  status?: PendingRecordStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
}
