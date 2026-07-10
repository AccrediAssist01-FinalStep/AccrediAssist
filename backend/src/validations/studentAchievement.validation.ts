import { z } from 'zod';
import { ACHIEVEMENT_TYPES } from '../database/enums';
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

export const studentAchievementListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  studentName: z.string().trim().optional(),
  department: z.string().trim().optional(),
  achievementType: z.enum(ACHIEVEMENT_TYPES).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z
    .enum(['studentName', 'date', 'achievementType', 'department', 'createdAt'])
    .default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createStudentAchievementSchema = z.object({
  studentName: z
    .string({ required_error: 'Student name is required' })
    .trim()
    .min(1, 'Student name is required')
    .max(100, 'Student name cannot exceed 100 characters'),
  rollNumber: z.string().trim().max(50).optional(),
  department: z.string().trim().max(100).optional(),
  achievementType: z.enum(ACHIEVEMENT_TYPES, {
    required_error: 'Achievement type is required',
  }),
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(300, 'Title cannot exceed 300 characters'),
  description: z.string().trim().max(2000).optional(),
  organization: z.string().trim().max(200).optional(),
  certificateUrl: urlSchema,
  photos: photosSchema,
  date: z.coerce.date({ required_error: 'Date is required', invalid_type_error: 'Invalid date' }),
});

export const updateStudentAchievementSchema = createStudentAchievementSchema.partial();

export type StudentAchievementListQuery = z.infer<typeof studentAchievementListQuerySchema>;
export type CreateStudentAchievementBody = z.infer<typeof createStudentAchievementSchema>;
export type UpdateStudentAchievementBody = z.infer<typeof updateStudentAchievementSchema>;
