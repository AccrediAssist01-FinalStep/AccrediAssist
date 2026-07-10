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

export const facultyAchievementListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  facultyName: z.string().trim().optional(),
  designation: z.string().trim().optional(),
  achievementType: z.enum(ACHIEVEMENT_TYPES).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z
    .enum(['facultyName', 'date', 'achievementType', 'designation', 'createdAt'])
    .default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createFacultyAchievementSchema = z.object({
  facultyName: z
    .string({ required_error: 'Faculty name is required' })
    .trim()
    .min(1, 'Faculty name is required')
    .max(100, 'Faculty name cannot exceed 100 characters'),
  designation: z.string().trim().max(100).optional(),
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

export const updateFacultyAchievementSchema = createFacultyAchievementSchema.partial();

export type FacultyAchievementListQuery = z.infer<typeof facultyAchievementListQuerySchema>;
export type CreateFacultyAchievementBody = z.infer<typeof createFacultyAchievementSchema>;
export type UpdateFacultyAchievementBody = z.infer<typeof updateFacultyAchievementSchema>;
