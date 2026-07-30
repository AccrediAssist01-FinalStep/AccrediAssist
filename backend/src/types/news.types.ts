import { IBaseDocument } from './base.types';

export const NEWS_ARTICLE_CATEGORIES = [
  'Student News',
  'Faculty News',
  'Department News',
  'General',
] as const;

export type NewsArticleCategory = (typeof NEWS_ARTICLE_CATEGORIES)[number];

export interface INews extends IBaseDocument {
  headline: string;
  articleText: string;
  articleLanguage: string;
  newspaperName?: string;
  publicationDate?: Date;
  peopleMentioned: string[];
  organization?: string;
  department?: string;
  articleCategory: NewsArticleCategory;
  summary?: string;
  confidenceScore?: number;
  imageUrl: string;
  sourceGroup?: string;
  sourceSender?: string;
  originalMessage?: string;
}

export interface INewsResponse {
  _id: string;
  headline: string;
  articleText: string;
  articleLanguage: string;
  newspaperName?: string;
  publicationDate?: string;
  peopleMentioned: string[];
  organization?: string;
  department?: string;
  articleCategory: NewsArticleCategory;
  summary?: string;
  confidenceScore?: number;
  imageUrl: string;
  sourceGroup?: string;
  sourceSender?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsFilters {
  search?: string;
  articleCategory?: NewsArticleCategory;
  articleLanguage?: string;
  newspaperName?: string;
  department?: string;
  fromDate?: string;
  toDate?: string;
}

export interface NewsSort {
  sortBy?: 'createdAt' | 'publicationDate' | 'headline';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateNewsInput {
  headline: string;
  articleText: string;
  articleLanguage: string;
  newspaperName?: string;
  publicationDate?: Date;
  peopleMentioned?: string[];
  organization?: string;
  department?: string;
  articleCategory: NewsArticleCategory;
  summary?: string;
  confidenceScore?: number;
  imageUrl: string;
  sourceGroup?: string;
  sourceSender?: string;
  originalMessage?: string;
}

export type UpdateNewsInput = Partial<CreateNewsInput>;

export interface NewsDashboardStats {
  totalArticles: number;
  pendingReviews: number;
  studentNews: number;
  facultyNews: number;
  departmentNews: number;
  monthlyCount: number;
  recentArticles: INewsResponse[];
  monthlyAnalytics: Array<{ month: string; count: number }>;
  aiInsights: string[];
}
