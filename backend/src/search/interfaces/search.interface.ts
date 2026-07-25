import { SmartSearchCollection } from '../config/search-collections.config';
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
}

export interface SearchResponse {
  query: string;
  collection?: SmartSearchCollection;
  items: SearchResultItem[];
  meta: PaginationMeta;
  parsedFilters?: Record<string, unknown>;
  confidence?: number | null;
}

export interface SearchModuleStatus {
  implemented: boolean;
  geminiConfigured: boolean;
  geminiModel: string;
  supportedCollections: readonly SmartSearchCollection[];
}
