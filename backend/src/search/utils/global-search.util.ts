import { SmartSearchCollection, SMART_SEARCH_COLLECTIONS } from '../config/search-collections.config';
import { FULL_TEXT_FILTER_KEYS } from '../config/search-execution.config';
import { SMART_SEARCH_COLLECTION_FIELDS, SmartSearchSort } from '../config/search-fields.config';
import { GlobalSearchApiData } from '../interfaces/global-search.interface';
import { SearchExecutionResult } from '../interfaces/search-execution.interface';
import {
  SmartSearchApiResponse,
  SmartSearchUnderstanding,
} from '../interfaces/smart-search-response.interface';
import { normalizeSmartSearchCollection } from './smart-search-result.util';

const QUERY_COLLECTION_PATTERNS: Array<{ pattern: RegExp; collection: SmartSearchCollection }> = [
  { pattern: /\b(news|newspaper|newspapers|magazine|clipping)\b/i, collection: 'news' },
  { pattern: /\b(placement|placements|placed|recruited|offer letter)\b/i, collection: 'placements' },
  { pattern: /\b(internship|internships|intern)\b/i, collection: 'internships' },
  {
    pattern: /\b(student achievement|student achievements|hackathon|student award)\b/i,
    collection: 'student_achievements',
  },
  {
    pattern: /\b(faculty achievement|faculty achievements|faculty award)\b/i,
    collection: 'faculty_achievements',
  },
  {
    pattern: /\b(publication|publications|journal|conference paper|research paper)\b/i,
    collection: 'publications',
  },
  { pattern: /\b(patent|patents|invention)\b/i, collection: 'patents' },
  {
    pattern: /\b(workshop|seminar|event report|guest lecture|industrial visit|completed event)\b/i,
    collection: 'completed_event_reports',
  },
];

export const inferCollectionFromQuery = (query: string): SmartSearchCollection | undefined => {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  const direct = normalizeSmartSearchCollection(normalized);

  if (direct) {
    return direct;
  }

  for (const { pattern, collection } of QUERY_COLLECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return collection;
    }
  }

  return undefined;
};

export const buildQueryFallbackFilters = (
  query: string,
  collection?: SmartSearchCollection,
): Record<string, unknown> => {
  const filters: Record<string, unknown> = { search: query.trim() };

  const yearMatch = query.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    filters.year = Number(yearMatch[1]);
  }

  const companyMatch = query.match(/\b(?:in|at|from|with)\s+([A-Za-z0-9][A-Za-z0-9&.\- ]{1,40})/i);
  if (companyMatch && collection === 'placements') {
    filters.company = companyMatch[1].trim();
  }

  return filters;
};

const isAllowedFilterKey = (
  collection: SmartSearchCollection,
  key: string,
): boolean =>
  FULL_TEXT_FILTER_KEYS.includes(key as (typeof FULL_TEXT_FILTER_KEYS)[number]) ||
  key === 'year' ||
  SMART_SEARCH_COLLECTION_FIELDS[collection].includes(
    key as (typeof SMART_SEARCH_COLLECTION_FIELDS)[SmartSearchCollection][number],
  );

export const inferCollectionFromFilters = (
  filters: Record<string, unknown>,
): SmartSearchCollection | undefined => {
  const keys = Object.keys(filters).filter(
    (key) =>
      !FULL_TEXT_FILTER_KEYS.includes(key as (typeof FULL_TEXT_FILTER_KEYS)[number]) &&
      key !== 'year',
  );

  if (keys.length === 0) {
    return undefined;
  }

  const matches = SMART_SEARCH_COLLECTIONS.filter((collection) =>
    keys.every((key) => isAllowedFilterKey(collection, key)),
  );

  return matches.length === 1 ? matches[0] : undefined;
};

export const mergeSearchFilters = (
  parsedFilters: Record<string, unknown>,
  requestFilters: Record<string, unknown> = {},
  collection?: SmartSearchCollection,
): Record<string, unknown> => {
  const merged = {
    ...parsedFilters,
    ...requestFilters,
  };

  if (!collection) {
    return merged;
  }

  return Object.fromEntries(
    Object.entries(merged).filter(([key]) => isAllowedFilterKey(collection, key)),
  );
};

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
