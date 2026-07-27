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

export interface GlobalSearchResponse {
  query: string;
  understanding: {
    collection: string;
    filters: Record<string, unknown>;
    sort: string;
    confidence: number | null;
    source: string;
  };
  filters: Record<string, unknown>;
  results: SearchResultItem[];
  meta: PaginatedMeta;
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
