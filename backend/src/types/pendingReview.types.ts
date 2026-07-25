import { PaginationOptions } from '../database/utils/queryHelpers';
import { PendingRecordStatus, RecordCategory } from '../database/enums';
import { PendingRecordSort } from './pendingRecord.types';

export interface PendingReviewListOptions {
  status?: PendingRecordStatus;
  category?: RecordCategory;
  title?: string;
  search?: string;
  groupName?: string;
  senderName?: string;
  pagination?: PaginationOptions;
  sort?: PendingRecordSort;
}

export interface PendingReviewDefaults {
  pagination: Required<PaginationOptions>;
  sort: PendingRecordSort;
}

export const DEFAULT_PENDING_REVIEW_LIST_OPTIONS: PendingReviewDefaults = {
  pagination: {
    page: 1,
    limit: 10,
  },
  sort: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
};
