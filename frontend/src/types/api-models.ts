import type { ApiResponse } from '@/types';

export interface DashboardSummary {
  totalStudents: number;
  totalFacultyAchievements: number;
  totalPlacements: number;
  totalInternships: number;
  totalPublications: number;
  totalPatents: number;
  pendingReviews: number;
}

export interface DashboardMonthlyStatistics {
  year: number;
  month: number;
  placements: number;
  internships: number;
  studentAchievements: number;
  facultyAchievements: number;
  publications: number;
  patents: number;
  pendingReviews: number;
  eventReports: number;
}

export interface DashboardYearlyStatistics {
  year: number;
  placements: number;
  internships: number;
  studentAchievements: number;
  facultyAchievements: number;
  publications: number;
  patents: number;
  pendingReviews: number;
  eventReports: number;
  monthlyBreakdown: Array<{
    month: number;
    total: number;
  }>;
}

export interface DashboardRecentActivity {
  id: string;
  action: string;
  module: string;
  description?: string;
  timestamp: string;
  userId?: string;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SearchResultItem {
  collection: string;
  recordId: string;
  summary: string;
  score?: number;
  data?: Record<string, unknown>;
}

export interface SearchUnderstanding {
  collection: string;
  filters: Record<string, unknown>;
  sort: string;
  confidence: number | null;
  source: string;
  model?: string;
  provider?: string;
}

export interface GlobalSearchResponse {
  query: string;
  understanding: SearchUnderstanding;
  filters: Record<string, unknown>;
  results: SearchResultItem[];
  meta: PaginatedMeta;
}

export interface SearchStatusResponse {
  queryUnderstanding: boolean;
  databaseSearch: boolean;
  integrated: boolean;
  geminiConfigured: boolean;
  geminiModel?: string;
  supportedCollections: string[];
}

export interface SearchCollectionsResponse {
  collections: string[];
}

export interface SearchHistoryItem {
  _id: string;
  query: string;
  resultCount: number;
  searchedAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export type ApiResult<T> = ApiResponse<T>;

export type PendingRecordStatus = 'Pending' | 'Approved' | 'Rejected' | 'Needs Review';

export type RecordCategory =
  | 'Placement'
  | 'Internship'
  | 'Workshop'
  | 'Seminar'
  | 'Industrial Visit'
  | 'Student Achievement'
  | 'Faculty Achievement'
  | 'Sports'
  | 'Cultural'
  | 'Patent'
  | 'Publication'
  | 'Certification'
  | 'Research';

export interface PendingRecordEditChange {
  field: string;
  previousValue: unknown;
  newValue: unknown;
}

export interface PendingRecordEditHistoryEntry {
  editedBy: string;
  editedAt: string;
  changes: PendingRecordEditChange[];
  previousConfidenceScore?: number;
  newConfidenceScore?: number;
}

export interface PendingRecordAiPipeline {
  classification?: {
    category?: string;
    confidence?: number | null;
    reasoning?: string | null;
  };
  validation?: {
    validationStatus?: 'valid' | 'invalid';
    validationErrors?: Array<{
      code: string;
      field?: string | null;
      message: string;
    }>;
  };
  duplicateDetection?: {
    duplicate?: boolean;
    similarityScore?: number;
    matchingRecordId?: string | null;
  };
  models?: {
    extraction?: string;
    classification?: string;
    validation?: string;
  };
}

export interface PendingRecordExtractedData {
  title?: string | null;
  description?: string | null;
  categoryHint?: string | null;
  studentNames?: string[] | null;
  studentName?: string | null;
  facultyNames?: string[] | null;
  facultyName?: string | null;
  company?: string | null;
  organization?: string | null;
  eventName?: string | null;
  eventType?: string | null;
  achievementType?: string | null;
  publicationTitle?: string | null;
  patentTitle?: string | null;
  internship?: string | null;
  placement?: string | null;
  certificates?: string[] | null;
  mediaReferences?: string[] | null;
  date?: string | null;
  location?: string | null;
  confidence?: number | null;
  media?: unknown;
  mediaMetadata?: unknown;
  aiPipeline?: PendingRecordAiPipeline;
  [key: string]: unknown;
}

export interface PendingRecord {
  _id: string;
  originalMessage: string;
  groupName?: string;
  senderName?: string;
  category: RecordCategory;
  extractedData?: PendingRecordExtractedData;
  confidenceScore: number;
  status: PendingRecordStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  editHistory?: PendingRecordEditHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface PendingRecordListResponse {
  items: PendingRecord[];
  meta: PaginatedMeta;
}

export interface EditPendingRecordPayload {
  extractedData?: Partial<PendingRecordExtractedData>;
  confidenceScore?: number;
  category?: RecordCategory;
}

export interface RejectPendingRecordPayload {
  reason: string;
}

export interface ReportFiltersApplied {
  startDate?: string;
  endDate?: string;
  department?: string;
  month?: string;
  year?: number;
  academicYear?: string;
  category?: string;
  [key: string]: unknown;
}

export type BackendReportType =
  | 'Monthly'
  | 'Placement'
  | 'Internship'
  | 'Student Achievement'
  | 'Faculty Achievement'
  | 'Completed Event';

export interface ReportRecord {
  _id: string;
  reportTitle: string;
  reportType: BackendReportType;
  generatedBy: string;
  generatedDate: string;
  fileUrl?: string;
  filtersApplied?: ReportFiltersApplied;
  downloadReady: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportListResponse {
  items: ReportRecord[];
  meta: PaginatedMeta;
}

export interface GenerateReportPayload {
  reportType: BackendReportType;
  month?: string;
  year?: number;
  academicYear?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReportDownloadInfo {
  reportId: string;
  reportTitle: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  status: 'ready';
}

export type ReportSortField = 'reportTitle' | 'reportType' | 'generatedDate' | 'createdAt';

export interface ReportQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  reportType?: BackendReportType;
  generatedBy?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: ReportSortField;
  sortOrder?: 'asc' | 'desc';
}

export type PendingRecordSortField =
  | 'createdAt'
  | 'status'
  | 'category'
  | 'senderName'
  | 'confidenceScore';

export interface PendingRecordQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  title?: string;
  status?: PendingRecordStatus;
  category?: RecordCategory;
  groupName?: string;
  senderName?: string;
  sortBy?: PendingRecordSortField;
  sortOrder?: 'asc' | 'desc';
}
