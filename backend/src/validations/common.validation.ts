import { z } from 'zod';
import mongoose from 'mongoose';

export const objectIdSchema = z
  .string({ required_error: 'ID is required' })
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Invalid ID format',
  });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
