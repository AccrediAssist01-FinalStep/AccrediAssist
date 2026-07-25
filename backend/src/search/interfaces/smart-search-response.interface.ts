import { PaginationMeta } from '../../types/api.types';
import { SmartSearchCollection } from '../config/search-collections.config';
import { SmartSearchSort } from '../config/search-fields.config';
import { SmartSearchParsedFilters } from './smart-search.interface';
import { SearchResultItem } from './search.interface';

export type SmartSearchUnderstandingSource = 'gemini' | 'structured';

export interface SmartSearchUnderstanding extends SmartSearchParsedFilters {
  source: SmartSearchUnderstandingSource;
  model?: string;
  provider?: 'gemini';
}

export interface SmartSearchResults {
  items: SearchResultItem[];
  meta: PaginationMeta;
}

export interface SmartSearchApiResponse {
  query?: string;
  understanding: SmartSearchUnderstanding;
  results: SmartSearchResults;
}

export interface SmartSearchRequestOptions {
  query: string;
  department?: string;
  collection?: SmartSearchCollection;
  page?: number;
  limit?: number;
  fields?: string[];
}

export interface StructuredSearchRequestOptions {
  collection: SmartSearchCollection;
  filters?: Record<string, unknown>;
  sort?: SmartSearchSort;
  department?: string;
  page?: number;
  limit?: number;
  fields?: string[];
}
