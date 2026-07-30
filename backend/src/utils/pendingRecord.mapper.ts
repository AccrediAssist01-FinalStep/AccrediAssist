import { IPendingRecord, IPendingRecordResponse } from '../types/pendingRecord.types';

export const toPendingRecordResponse = (record: IPendingRecord): IPendingRecordResponse => ({
  _id: record._id,
  originalMessage: record.originalMessage,
  groupName: record.groupName,
  senderName: record.senderName,
  category: record.category,
  extractedData: record.extractedData,
  confidenceScore: record.confidenceScore,
  status: record.status,
  rejectionReason: record.rejectionReason,
  reviewedBy: record.reviewedBy,
  reviewedAt: record.reviewedAt,
  approvedRecordId: record.approvedRecordId,
  approvedTargetModule: record.approvedTargetModule,
  editHistory: record.editHistory ?? [],
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
