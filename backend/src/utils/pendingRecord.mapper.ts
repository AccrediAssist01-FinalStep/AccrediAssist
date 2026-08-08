import { IPendingRecord, IPendingRecordResponse } from '../types/pendingRecord.types';
import { normalizeExtractedPersonFields } from './extractedPersonFields.util';

export const toPendingRecordResponse = (record: IPendingRecord): IPendingRecordResponse => ({
  _id: record._id,
  originalMessage: record.originalMessage,
  groupName: record.groupName,
  senderName: record.senderName,
  whatsappMessageId: record.whatsappMessageId,
  category: record.category,
  extractedData: record.extractedData
    ? normalizeExtractedPersonFields(record.extractedData)
    : record.extractedData,
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
