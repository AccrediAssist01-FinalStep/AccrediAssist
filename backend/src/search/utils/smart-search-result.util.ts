import { z } from 'zod';
import { SMART_SEARCH_COLLECTIONS } from '../config/search-collections.config';
import { SmartSearchParsedFilters } from '../interfaces/smart-search.interface';

const nullableConfidence = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.number().min(0).max(100).nullable(),
);

export const smartSearchResultSchema = z.object({
  collection: z.union([z.enum(SMART_SEARCH_COLLECTIONS), z.literal('')]),
  filters: z.record(z.unknown()),
  confidence: nullableConfidence,
});

export const normalizeSmartSearchResult = (payload: unknown): SmartSearchParsedFilters => {
  const parsed = smartSearchResultSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      collection: '',
      filters: {},
      confidence: null,
    };
  }

  return parsed.data;
};
