import { PaginationOptions } from '../../database/utils/queryHelpers';
import { SmartSearchCollection } from '../config/search-collections.config';
import { SmartSearchSort } from '../config/search-fields.config';
import { SearchResponse, SearchResultItem } from './search.interface';

export interface SearchExecuteRequest {
  collection: SmartSearchCollection;
  filters?: Record<string, unknown>;
  sort?: SmartSearchSort;
  department?: string;
  fields?: string[];
  pagination?: PaginationOptions;
}

export interface SearchExecuteResponse extends Omit<SearchResponse, 'query' | 'confidence'> {
  collection: SmartSearchCollection;
}

export interface SearchExecutionResult {
  items: SearchResultItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
