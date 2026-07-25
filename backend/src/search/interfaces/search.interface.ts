import { SmartSearchCollection } from '../config/search-collections.config';
import { SmartSearchSort } from '../config/search-fields.config';
import { PaginationMeta } from '../../types/api.types';

export interface SearchRequest {
  query: string;
  department?: string;
  collection?: SmartSearchCollection;
}

export interface SearchResultItem {
  collection: SmartSearchCollection;
  recordId: string;
  summary: string;
  score?: number;
  data?: Record<string, unknown>;
}

export interface SearchResponse {
  query: string;
  collection?: SmartSearchCollection;
  filters?: Record<string, unknown>;
  sort?: SmartSearchSort;
  items: SearchResultItem[];
  meta: PaginationMeta;
  confidence?: number | null;
}

export interface SearchModuleStatus {
  queryUnderstanding: boolean;
  databaseSearch: boolean;
  integrated: boolean;
  geminiConfigured: boolean;
  geminiModel: string;
  supportedCollections: readonly SmartSearchCollection[];
}
