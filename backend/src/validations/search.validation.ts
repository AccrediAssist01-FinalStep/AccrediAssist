import { z } from 'zod';
import { SMART_SEARCH_COLLECTIONS } from '../search/config/search-collections.config';
import { SMART_SEARCH_SORT_VALUES } from '../search/config/search-fields.config';
import { paginationSchema } from './common.validation';

const optionalSearchCollectionSchema = z.preprocess((value) => {
  if (value === 'all' || value === '' || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, z.enum(SMART_SEARCH_COLLECTIONS).optional());

export const globalSearchRequestSchema = paginationSchema.extend({
  query: z
    .string({ required_error: 'Search query is required' })
    .trim()
    .min(1, 'Search query is required')
    .max(500, 'Search query cannot exceed 500 characters'),
  department: z.string().trim().max(100).optional(),
  collection: optionalSearchCollectionSchema,
  filters: z.record(z.string(), z.unknown()).optional(),
  sort: z.enum(SMART_SEARCH_SORT_VALUES).optional(),
  fields: z.array(z.string().trim().min(1)).max(30).optional(),
});

export const searchRequestSchema = globalSearchRequestSchema;

export const searchExecuteSchema = paginationSchema.extend({
  collection: z.enum(SMART_SEARCH_COLLECTIONS, {
    required_error: 'Search collection is required',
  }),
  filters: z.record(z.string(), z.unknown()).optional().default({}),
  sort: z.enum(SMART_SEARCH_SORT_VALUES).optional(),
  department: z.string().trim().max(100).optional(),
  fields: z.array(z.string().trim().min(1)).max(30).optional(),
});

export const searchListQuerySchema = paginationSchema.extend({
  query: z
    .string({ required_error: 'Search query is required' })
    .trim()
    .min(1, 'Search query is required')
    .max(500, 'Search query cannot exceed 500 characters'),
  department: z.string().trim().max(100).optional(),
  collection: optionalSearchCollectionSchema,
  filters: z.preprocess((value) => {
    if (typeof value === 'string' && value.trim()) {
      try {
        return JSON.parse(value) as Record<string, unknown>;
      } catch {
        return value;
      }
    }

    return value;
  }, z.record(z.string(), z.unknown()).optional()),
  sort: z.enum(SMART_SEARCH_SORT_VALUES).optional(),
  fields: z.string().trim().optional(),
});

export type GlobalSearchRequestBody = z.infer<typeof globalSearchRequestSchema>;
export type SearchRequestBody = GlobalSearchRequestBody;
export type SearchExecuteBody = z.infer<typeof searchExecuteSchema>;
export type SearchListQuery = z.infer<typeof searchListQuerySchema>;

export const searchHistoryListQuerySchema = paginationSchema;

export type SearchHistoryListQuery = z.infer<typeof searchHistoryListQuerySchema>;
