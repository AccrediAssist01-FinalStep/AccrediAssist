import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';
import { PendingRecordStatus, RecordCategory } from '../database/enums';

export interface PendingRecordEditChange {
  field: string;
  previousValue: unknown;
  newValue: unknown;
}

export interface PendingRecordEditHistoryEntry {
  editedBy: Types.ObjectId;
  editedAt: Date;
  changes: PendingRecordEditChange[];
  previousConfidenceScore?: number;
  newConfidenceScore?: number;
}

export interface EditPendingRecordInput {
  extractedData?: Record<string, unknown>;
  confidenceScore?: number;
  category?: RecordCategory;
}

export interface IPendingRecord extends IBaseDocument {
  originalMessage: string;
  groupName?: string;
  senderName?: string;
  category: RecordCategory;
  extractedData?: Record<string, unknown>;
  confidenceScore: number;
  status: PendingRecordStatus;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  approvedRecordId?: Types.ObjectId;
  approvedTargetModule?: string;
  editHistory?: PendingRecordEditHistoryEntry[];
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
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
}

export interface IPendingRecordResponse {
  _id: Types.ObjectId;
  originalMessage: string;
  groupName?: string;
  senderName?: string;
  category: RecordCategory;
  extractedData?: Record<string, unknown>;
  confidenceScore: number;
  status: PendingRecordStatus;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  approvedRecordId?: Types.ObjectId;
  approvedTargetModule?: string;
  editHistory?: PendingRecordEditHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingRecordFilters {
  search?: string;
  title?: string;
  status?: PendingRecordStatus;
  category?: RecordCategory;
  groupName?: string;
  senderName?: string;
}

export interface PendingRecordSort {
  sortBy: 'createdAt' | 'status' | 'category' | 'senderName' | 'confidenceScore';
  sortOrder: 'asc' | 'desc';
}

export interface RejectPendingRecordInput {
  reason: string;
}
