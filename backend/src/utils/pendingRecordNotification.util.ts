import { Types } from 'mongoose';
import { NotificationType } from '../database/enums';
import { IPendingRecordResponse } from '../types/pendingRecord.types';

const getPendingRecordLabel = (record: IPendingRecordResponse): string => {
  const extractedData = record.extractedData ?? {};

  const title =
    (typeof extractedData.title === 'string' && extractedData.title.trim()) ||
    (typeof extractedData.eventName === 'string' && extractedData.eventName.trim()) ||
    (typeof extractedData.publicationTitle === 'string' &&
      extractedData.publicationTitle.trim()) ||
    (typeof extractedData.patentTitle === 'string' && extractedData.patentTitle.trim());

  return title || record.category;
};

export const buildPendingRecordCreatedNotification = (
  record: IPendingRecordResponse,
): { title: string; message: string; type: NotificationType } => ({
  title: 'New Pending Record',
  message: `A new ${record.category} record "${getPendingRecordLabel(record)}" requires faculty review.`,
  type: 'AI',
});

export const buildPendingRecordApprovedNotification = (
  record: IPendingRecordResponse,
): { title: string; message: string; type: NotificationType } => ({
  title: 'Pending Record Approved',
  message: `Pending record "${getPendingRecordLabel(record)}" was approved and moved to the final collection.`,
  type: 'Approval',
});

export const buildPendingRecordRejectedNotification = (
  record: IPendingRecordResponse,
): { title: string; message: string; type: NotificationType } => {
  const reason = record.rejectionReason?.trim();
  const suffix = reason ? ` Reason: ${reason}` : '';

  return {
    title: 'Pending Record Rejected',
    message: `Pending record "${getPendingRecordLabel(record)}" was rejected.${suffix}`,
    type: 'System',
  };
};

export const toObjectId = (userId: string): Types.ObjectId => new Types.ObjectId(userId);
