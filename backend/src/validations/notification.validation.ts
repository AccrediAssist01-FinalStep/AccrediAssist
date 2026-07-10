import { z } from 'zod';
import { NOTIFICATION_TYPES } from '../database/enums';
import { paginationSchema } from './common.validation';

export const notificationListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  isRead: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  sortBy: z.enum(['createdAt', 'title', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
