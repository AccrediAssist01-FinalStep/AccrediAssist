import { z } from 'zod';
import { SMART_SEARCH_COLLECTIONS } from '../config/search-collections.config';
import {
  SMART_SEARCH_COLLECTION_ALIASES,
  SMART_SEARCH_SORT_VALUES,
} from '../config/search-fields.config';
import { SmartSearchCollection } from '../config/search-collections.config';
import { SmartSearchParsedFilters } from '../interfaces/smart-search.interface';

const nullableConfidence = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.number().min(0).max(100).nullable(),
);

const sortAliases: Record<string, (typeof SMART_SEARCH_SORT_VALUES)[number]> = {
  latest: 'latest',
  newest: 'latest',
  recent: 'latest',
  oldest: 'oldest',
  earliest: 'oldest',
  '': '',
};

export const normalizeSmartSearchCollection = (value: unknown): SmartSearchCollection | '' => {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');

  if (!normalized) {
    return '';
  }

  const aliased = SMART_SEARCH_COLLECTION_ALIASES[normalized];

  if (aliased) {
    return aliased;
  }

  if ((SMART_SEARCH_COLLECTIONS as readonly string[]).includes(normalized)) {
    return normalized as SmartSearchCollection;
  }

  if (normalized.includes('publication')) {
    return 'publications';
  }

  if (normalized.includes('internship')) {
    return 'internships';
  }

  if (normalized.includes('placement')) {
    return 'placements';
  }

  if (normalized.includes('patent')) {
    return 'patents';
  }

  if (normalized.includes('student') && normalized.includes('achievement')) {
    return 'student_achievements';
  }

  if (normalized.includes('faculty') && normalized.includes('achievement')) {
    return 'faculty_achievements';
  }

  if (normalized.includes('event') || normalized.includes('workshop')) {
    return 'completed_event_reports';
  }

  return '';
};

export const normalizeSmartSearchSort = (value: unknown): (typeof SMART_SEARCH_SORT_VALUES)[number] => {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toLowerCase();

  return sortAliases[normalized] ?? '';
};

export const smartSearchResultSchema = z.object({
  collection: z.union([z.enum(SMART_SEARCH_COLLECTIONS), z.literal('')]),
  filters: z.record(z.unknown()),
  sort: z.enum(SMART_SEARCH_SORT_VALUES),
  confidence: nullableConfidence,
});

export const normalizeSmartSearchResult = (payload: unknown): SmartSearchParsedFilters => {
  if (!payload || typeof payload !== 'object') {
    return {
      collection: '',
      filters: {},
      sort: '',
      confidence: null,
    };
  }

  const record = payload as Record<string, unknown>;
  const collection = normalizeSmartSearchCollection(record.collection);
  const sort = normalizeSmartSearchSort(record.sort);
  const filters =
    record.filters && typeof record.filters === 'object' && !Array.isArray(record.filters)
      ? (record.filters as Record<string, unknown>)
      : {};

  const parsed = smartSearchResultSchema.safeParse({
    collection,
    filters,
    sort,
    confidence: record.confidence,
  });

  if (!parsed.success) {
    return {
      collection,
      filters,
      sort,
      confidence: null,
    };
  }

  return parsed.data;
};
