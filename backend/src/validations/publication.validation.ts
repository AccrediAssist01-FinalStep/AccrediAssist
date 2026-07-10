import { z } from 'zod';
import { paginationSchema } from './common.validation';

const urlSchema = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .optional()
  .or(z.literal('').transform(() => undefined));

const authorsSchema = z
  .array(z.string().trim().min(1, 'Author name cannot be empty'))
  .optional()
  .default([]);

const publicationBodySchema = z.object({
  facultyName: z
    .string({ required_error: 'Faculty name is required' })
    .trim()
    .min(1, 'Faculty name is required')
    .max(100, 'Faculty name cannot exceed 100 characters'),
  paperTitle: z
    .string({ required_error: 'Paper title is required' })
    .trim()
    .min(1, 'Paper title is required')
    .max(500, 'Paper title cannot exceed 500 characters'),
  journal: z.string().trim().max(200).optional(),
  conference: z.string().trim().max(200).optional(),
  authors: authorsSchema,
  doi: z.string().trim().max(100).optional(),
  publicationDate: z.coerce.date().optional(),
  documentUrl: urlSchema,
});

export const publicationListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  facultyName: z.string().trim().optional(),
  journal: z.string().trim().optional(),
  conference: z.string().trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z
    .enum(['facultyName', 'paperTitle', 'publicationDate', 'createdAt'])
    .default('publicationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createPublicationSchema = publicationBodySchema;

export const updatePublicationSchema = publicationBodySchema.partial();

export type PublicationListQuery = z.infer<typeof publicationListQuerySchema>;
export type CreatePublicationBody = z.infer<typeof createPublicationSchema>;
export type UpdatePublicationBody = z.infer<typeof updatePublicationSchema>;
