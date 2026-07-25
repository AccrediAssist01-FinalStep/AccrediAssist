import { SmartSearchSort } from '../config/search-fields.config';
import {
  GlobalSearchApiData,
} from '../interfaces/global-search.interface';import { SearchExecutionResult } from '../interfaces/search-execution.interface';
import {
  SmartSearchApiResponse,
  SmartSearchUnderstanding,
} from '../interfaces/smart-search-response.interface';

export const mergeSearchFilters = (
  parsedFilters: Record<string, unknown>,
  requestFilters: Record<string, unknown> = {},
): Record<string, unknown> => ({
  ...parsedFilters,
  ...requestFilters,
});

export const resolveSearchSort = (
  parsedSort: SmartSearchSort,
  requestSort?: SmartSearchSort,
): SmartSearchSort => requestSort ?? parsedSort ?? '';

export const toGlobalSearchApiData = (
  query: string,
  understanding: SmartSearchUnderstanding,
  filters: Record<string, unknown>,
  execution: SearchExecutionResult,
): GlobalSearchApiData => ({
  query,
  understanding,
  filters,
  results: execution.items,
  meta: execution.meta,
});

export const toGlobalSearchFromSmartSearch = (
  response: SmartSearchApiResponse,
  filters: Record<string, unknown>,
): GlobalSearchApiData => ({
  query: response.query ?? '',
  understanding: response.understanding,
  filters,
  results: response.results.items,
  meta: response.results.meta,
});

export const buildGlobalSearchHistoryQuery = (query: string): string => query.trim();
