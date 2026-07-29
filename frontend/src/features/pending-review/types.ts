import type {
  PendingRecord,
  PendingRecordSortField,
  PendingRecordStatus,
  RecordCategory,
} from '@/types/api-models';

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type DateFilter = 'all' | 'today' | 'week' | 'month';
export type StatusFilter = 'active' | 'all' | PendingRecordStatus;

export interface PendingReviewFilters {
  search: string;
  category: RecordCategory | 'all';
  status: StatusFilter;
  confidence: ConfidenceLevel | 'all';
  date: DateFilter;
  sortBy: PendingRecordSortField;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export const DEFAULT_FILTERS: PendingReviewFilters = {
  search: '',
  category: 'all',
  status: 'all',
  confidence: 'all',
  date: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 12,
};

export const RECORD_CATEGORIES: RecordCategory[] = [
  'Placement',
  'Internship',
  'Workshop',
  'Seminar',
  'Industrial Visit',
  'Student Achievement',
  'Faculty Achievement',
  'Sports',
  'Cultural',
  'Patent',
  'Publication',
  'Certification',
  'Research',
];

export interface PendingReviewHeaderStats {
  totalPending: number;
  approvedToday: number;
  rejectedToday: number;
  averageConfidence: number | null;
}

export interface PendingReviewListResult {
  items: PendingRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AiInsightSummary {
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  validationStatus: 'valid' | 'invalid' | 'unknown';
  duplicateStatus: 'none' | 'possible' | 'duplicate';
  recommendedAction: string;
}
