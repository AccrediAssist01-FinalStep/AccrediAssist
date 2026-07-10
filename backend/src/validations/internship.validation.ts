import { z } from 'zod';
import { paginationSchema } from './common.validation';

const urlSchema = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .optional()
  .or(z.literal('').transform(() => undefined));

const internshipBodySchema = z.object({
  studentName: z
    .string({ required_error: 'Student name is required' })
    .trim()
    .min(1, 'Student name is required')
    .max(100, 'Student name cannot exceed 100 characters'),
  rollNumber: z.string().trim().max(50).optional(),
  company: z
    .string({ required_error: 'Company is required' })
    .trim()
    .min(1, 'Company is required')
    .max(200, 'Company cannot exceed 200 characters'),
  role: z.string().trim().max(150).optional(),
  duration: z.string().trim().max(50).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  certificateUrl: urlSchema,
});

const validateDateRange = (data: {
  startDate?: Date;
  endDate?: Date;
}): boolean => !data.startDate || !data.endDate || data.endDate >= data.startDate;

export const internshipListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  company: z.string().trim().optional(),
  sortBy: z
    .enum(['studentName', 'company', 'startDate', 'endDate', 'createdAt'])
    .default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createInternshipSchema = internshipBodySchema.refine(validateDateRange, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export const updateInternshipSchema = internshipBodySchema.partial().refine(validateDateRange, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export type InternshipListQuery = z.infer<typeof internshipListQuerySchema>;
export type CreateInternshipBody = z.infer<typeof createInternshipSchema>;
export type UpdateInternshipBody = z.infer<typeof updateInternshipSchema>;
