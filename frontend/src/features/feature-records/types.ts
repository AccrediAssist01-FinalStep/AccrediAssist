import type { PaginatedMeta } from '@/types/api-models';
import { getFeatureListProfile } from './utils/feature-list-profile';

export type FeatureColumnFormat = 'text' | 'date' | 'list';

export interface FeatureColumn {
  key: string;
  label: string;
  format?: FeatureColumnFormat;
}

export interface FeatureRecordConfig {
  id: string;
  title: string;
  description: string;
  apiPath: string;
  route: string;
  searchPlaceholder: string;
  columns: FeatureColumn[];
  listFilters?: Record<string, string>;
}

export interface FeatureRecord extends Record<string, unknown> {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeatureRecordFilters {
  search: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  year: number | 'all';
  listFilters?: Record<string, string>;
}

export interface FeatureRecordListResponse {
  items: FeatureRecord[];
  meta: PaginatedMeta;
}

export const createDefaultFeatureFilters = (apiPath: string): FeatureRecordFilters => {
  const profile = getFeatureListProfile(apiPath);

  return {
    search: '',
    page: 1,
    limit: 10,
    sortBy: profile.defaultSortBy,
    sortOrder: profile.defaultSortOrder,
    year: 'all',
  };
};

/** @deprecated Use createDefaultFeatureFilters(apiPath) for module-specific defaults */
export const DEFAULT_FEATURE_FILTERS: FeatureRecordFilters = {
  search: '',
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  year: 'all',
};
