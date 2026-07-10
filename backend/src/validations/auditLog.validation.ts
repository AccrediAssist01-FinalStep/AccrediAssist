import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common.validation';

export const auditLogListQuerySchema = paginationSchema.extend({
  userId: objectIdSchema.optional(),
  module: z.string().trim().optional(),
  action: z.string().trim().optional(),
  search: z.string().trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z.enum(['timestamp', 'module', 'action', 'createdAt']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;
