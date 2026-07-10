import { z } from 'zod';
import { paginationSchema } from './common.validation';

const urlSchema = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const placementListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  company: z.string().trim().optional(),
  department: z.string().trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z
    .enum(['studentName', 'company', 'department', 'joiningDate', 'createdAt'])
    .default('joiningDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createPlacementSchema = z.object({
  studentName: z
    .string({ required_error: 'Student name is required' })
    .trim()
    .min(1, 'Student name is required')
    .max(100, 'Student name cannot exceed 100 characters'),
  rollNumber: z.string().trim().max(50).optional(),
  department: z.string().trim().max(100).optional(),
  company: z
    .string({ required_error: 'Company is required' })
    .trim()
    .min(1, 'Company is required')
    .max(200, 'Company cannot exceed 200 characters'),
  role: z.string().trim().max(150).optional(),
  package: z.string().trim().max(50).optional(),
  joiningDate: z.coerce.date().optional(),
  offerLetter: urlSchema,
});

export const updatePlacementSchema = createPlacementSchema.partial();

export type PlacementListQuery = z.infer<typeof placementListQuerySchema>;
export type CreatePlacementBody = z.infer<typeof createPlacementSchema>;
export type UpdatePlacementBody = z.infer<typeof updatePlacementSchema>;
