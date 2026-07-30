import { z } from 'zod';
import { NEWS_ARTICLE_CATEGORIES } from '../types/news.types';
import { paginationSchema } from './common.validation';

const urlSchema = z
  .string()
  .trim()
  .url('Must be a valid URL');

const newsBodySchema = z.object({
  headline: z.string().trim().min(1).max(500),
  articleText: z.string().trim().min(1).max(20000),
  articleLanguage: z.string().trim().min(1).max(50),
  newspaperName: z.string().trim().max(200).optional(),
  publicationDate: z.coerce.date().optional(),
  peopleMentioned: z.array(z.string().trim().min(1)).optional().default([]),
  organization: z.string().trim().max(200).optional(),
  department: z.string().trim().max(200).optional(),
  articleCategory: z.enum(NEWS_ARTICLE_CATEGORIES),
  summary: z.string().trim().max(2000).optional(),
  confidenceScore: z.number().min(0).max(100).optional(),
  imageUrl: urlSchema,
  sourceGroup: z.string().trim().max(200).optional(),
  sourceSender: z.string().trim().max(100).optional(),
  originalMessage: z.string().trim().max(5000).optional(),
});

export const newsListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  articleCategory: z.enum(NEWS_ARTICLE_CATEGORIES).optional(),
  articleLanguage: z.string().trim().optional(),
  newspaperName: z.string().trim().optional(),
  department: z.string().trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'publicationDate', 'headline']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createNewsSchema = newsBodySchema;
export const updateNewsSchema = newsBodySchema.partial();

export type NewsListQuery = z.infer<typeof newsListQuerySchema>;
export type CreateNewsBody = z.infer<typeof createNewsSchema>;
export type UpdateNewsBody = z.infer<typeof updateNewsSchema>;
