import { z } from 'zod';
import { EVENT_TYPES } from '../database/enums';
import { paginationSchema } from './common.validation';

const urlSchema = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .optional()
  .or(z.literal('').transform(() => undefined));

const photosSchema = z
  .array(z.string().trim().url('All photo URLs must be valid'))
  .optional()
  .default([]);

const completedEventReportBodySchema = z.object({
  eventTitle: z
    .string({ required_error: 'Event title is required' })
    .trim()
    .min(1, 'Event title is required')
    .max(300, 'Event title cannot exceed 300 characters'),
  eventType: z.enum(EVENT_TYPES, { required_error: 'Event type is required' }),
  date: z.coerce.date().optional(),
  venue: z.string().trim().max(200).optional(),
  coordinator: z.string().trim().max(100).optional(),
  participants: z.coerce.number().int().min(0).optional(),
  summary: z.string().trim().max(2000).optional(),
  description: z.string().trim().max(5000).optional(),
  photoUrls: photosSchema,
  generatedReportUrl: urlSchema,
});

export const completedEventReportListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  eventType: z.enum(EVENT_TYPES).optional(),
  eventTitle: z.string().trim().optional(),
  coordinator: z.string().trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z.enum(['eventTitle', 'eventType', 'date', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createCompletedEventReportSchema = completedEventReportBodySchema;

export const updateCompletedEventReportSchema = completedEventReportBodySchema.partial();

export type CompletedEventReportListQuery = z.infer<
  typeof completedEventReportListQuerySchema
>;
export type CreateCompletedEventReportBody = z.infer<typeof createCompletedEventReportSchema>;
export type UpdateCompletedEventReportBody = z.infer<typeof updateCompletedEventReportSchema>;
