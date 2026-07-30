import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type { PaginatedMeta } from '@/types/api-models';

export interface NewsArticle {
  _id: string;
  headline: string;
  articleText: string;
  articleLanguage: string;
  newspaperName?: string;
  publicationDate?: string;
  peopleMentioned: string[];
  organization?: string;
  department?: string;
  articleCategory: 'Student News' | 'Faculty News' | 'Department News' | 'General';
  summary?: string;
  confidenceScore?: number;
  imageUrl: string;
  sourceGroup?: string;
  sourceSender?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsDashboardStats {
  totalArticles: number;
  pendingReviews: number;
  studentNews: number;
  facultyNews: number;
  departmentNews: number;
  monthlyCount: number;
  recentArticles: NewsArticle[];
  monthlyAnalytics: Array<{ month: string; count: number }>;
  aiInsights: string[];
}

export interface NewsListResponse {
  items: NewsArticle[];
  meta: PaginatedMeta;
}

export const newsService = {
  async getDashboard(): Promise<NewsDashboardStats> {
    const response = await apiClient.get<ApiResponse<NewsDashboardStats>>('/news/dashboard');
    return response.data.data!;
  },

  async list(params: Record<string, string | number | undefined> = {}): Promise<NewsListResponse> {
    const { data } = await apiClient.get<ApiResponse<NewsListResponse>>('/news', { params });
    return data.data!;
  },

  async getById(id: string): Promise<NewsArticle> {
    const response = await apiClient.get<ApiResponse<NewsArticle>>(`/news/${id}`);
    return response.data.data!;
  },
};
