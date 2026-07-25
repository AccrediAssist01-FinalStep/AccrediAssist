import { SmartSearchCollection } from '../config/search-collections.config';
import { SmartSearchSort } from '../config/search-fields.config';

export interface SmartSearchQueryInput {
  query: string;
  department?: string;
  collections?: SmartSearchCollection[];
}

export interface SmartSearchParsedFilters {
  collection: SmartSearchCollection | '';
  filters: Record<string, unknown>;
  sort: SmartSearchSort;
  confidence: number | null;
}

export interface SmartSearchAgentResponse {
  result: SmartSearchParsedFilters;
  model: string;
  provider: 'gemini';
}

export const SMART_SEARCH_RESULT_KEYS: Array<keyof SmartSearchParsedFilters> = [
  'collection',
  'filters',
  'sort',
  'confidence',
];
