import { z } from 'zod';
import { SMART_SEARCH_COLLECTIONS } from '../search/config/search-collections.config';
import { paginationSchema } from './common.validation';

export const searchRequestSchema = z.object({
  query: z
    .string({ required_error: 'Search query is required' })
    .trim()
    .min(1, 'Search query is required')
    .max(500, 'Search query cannot exceed 500 characters'),
  department: z.string().trim().max(100).optional(),
  collection: z.enum(SMART_SEARCH_COLLECTIONS).optional(),
});

export const searchListQuerySchema = paginationSchema.extend({
  query: z
    .string({ required_error: 'Search query is required' })
    .trim()
    .min(1, 'Search query is required')
    .max(500, 'Search query cannot exceed 500 characters'),
  department: z.string().trim().max(100).optional(),
  collection: z.enum(SMART_SEARCH_COLLECTIONS).optional(),
});

export type SearchRequestBody = z.infer<typeof searchRequestSchema>;
export type SearchListQuery = z.infer<typeof searchListQuerySchema>;
