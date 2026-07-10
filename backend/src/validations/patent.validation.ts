import { z } from 'zod';
import { PATENT_STATUSES } from '../database/enums';
import { paginationSchema } from './common.validation';

const urlSchema = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .optional()
  .or(z.literal('').transform(() => undefined));

const inventorsSchema = z
  .array(z.string().trim().min(1, 'Inventor name cannot be empty'))
  .optional()
  .default([]);

const patentBodySchema = z.object({
  patentTitle: z
    .string({ required_error: 'Patent title is required' })
    .trim()
    .min(1, 'Patent title is required')
    .max(500, 'Patent title cannot exceed 500 characters'),
  inventors: inventorsSchema,
  patentNumber: z.string().trim().max(50).optional(),
  status: z.enum(PATENT_STATUSES, { required_error: 'Patent status is required' }),
  filingDate: z.coerce.date().optional(),
  documentUrl: urlSchema,
});

export const patentListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  status: z.enum(PATENT_STATUSES).optional(),
  patentNumber: z.string().trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z.enum(['patentTitle', 'status', 'filingDate', 'createdAt']).default('filingDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createPatentSchema = patentBodySchema;

export const updatePatentSchema = patentBodySchema.partial();

export type PatentListQuery = z.infer<typeof patentListQuerySchema>;
export type CreatePatentBody = z.infer<typeof createPatentSchema>;
export type UpdatePatentBody = z.infer<typeof updatePatentSchema>;
