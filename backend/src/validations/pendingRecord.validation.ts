import { z } from 'zod';
import { PENDING_RECORD_STATUSES, RECORD_CATEGORIES } from '../database/enums';
import { paginationSchema } from './common.validation';

export const pendingRecordListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  status: z.enum(PENDING_RECORD_STATUSES).optional(),
  category: z.enum(RECORD_CATEGORIES).optional(),
  groupName: z.string().trim().optional(),
  senderName: z.string().trim().optional(),
  sortBy: z
    .enum(['createdAt', 'status', 'category', 'senderName', 'confidenceScore'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updatePendingRecordSchema = z.object({
  originalMessage: z
    .string()
    .trim()
    .min(1, 'Original message cannot be empty')
    .max(5000, 'Original message cannot exceed 5000 characters')
    .optional(),
  groupName: z.string().trim().max(200).optional(),
  senderName: z.string().trim().max(100).optional(),
  category: z.enum(RECORD_CATEGORIES).optional(),
  extractedData: z.record(z.unknown()).optional(),
  confidenceScore: z.number().min(0).max(100).optional(),
  status: z.enum(['Pending', 'Needs Review'] as const).optional(),
});

export const rejectPendingRecordSchema = z.object({
  reason: z.string().trim().max(1000, 'Reason cannot exceed 1000 characters').optional(),
});

export type PendingRecordListQuery = z.infer<typeof pendingRecordListQuerySchema>;
export type UpdatePendingRecordBody = z.infer<typeof updatePendingRecordSchema>;
export type RejectPendingRecordBody = z.infer<typeof rejectPendingRecordSchema>;
