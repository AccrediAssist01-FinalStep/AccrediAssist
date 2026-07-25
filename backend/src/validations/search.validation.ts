import { z } from 'zod';
import { SMART_SEARCH_COLLECTIONS } from '../search/config/search-collections.config';
import { SMART_SEARCH_SORT_VALUES } from '../search/config/search-fields.config';
import { paginationSchema } from './common.validation';

export const searchRequestSchema = paginationSchema.extend({
  query: z
    .string({ required_error: 'Search query is required' })
    .trim()
    .min(1, 'Search query is required')
    .max(500, 'Search query cannot exceed 500 characters'),
  department: z.string().trim().max(100).optional(),
  collection: z.enum(SMART_SEARCH_COLLECTIONS).optional(),
  fields: z.array(z.string().trim().min(1)).max(30).optional(),
});

export const searchExecuteSchema = paginationSchema.extend({
  collection: z.enum(SMART_SEARCH_COLLECTIONS, {
    required_error: 'Search collection is required',
  }),
  filters: z.record(z.unknown()).optional().default({}),
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
  collection: z.enum(SMART_SEARCH_COLLECTIONS).optional(),
  fields: z.string().trim().optional(),
});

export type SearchRequestBody = z.infer<typeof searchRequestSchema>;
export type SearchExecuteBody = z.infer<typeof searchExecuteSchema>;
export type SearchListQuery = z.infer<typeof searchListQuerySchema>;

export const searchHistoryListQuerySchema = paginationSchema;

export type SearchHistoryListQuery = z.infer<typeof searchHistoryListQuerySchema>;
