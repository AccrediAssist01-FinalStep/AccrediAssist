import { PaginationMeta } from '../../types/api.types';
import { SmartSearchCollection } from '../config/search-collections.config';
import { SmartSearchSort } from '../config/search-fields.config';
import { SearchResultItem } from './search.interface';
import { SmartSearchUnderstanding } from './smart-search-response.interface';

export interface GlobalSearchApiData {
  query: string;
  understanding: SmartSearchUnderstanding;
  filters: Record<string, unknown>;
  results: SearchResultItem[];
  meta: PaginationMeta;
}

export interface GlobalSearchRequestOptions {
  query: string;
  department?: string;
  collection?: SmartSearchCollection;
  filters?: Record<string, unknown>;
  sort?: SmartSearchSort;
  page?: number;
  limit?: number;
  fields?: string[];
}
