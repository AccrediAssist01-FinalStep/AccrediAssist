import type { NotificationQueryParams } from '@/types/api-models';

export type NotificationReadFilter = 'all' | 'unread' | 'read';

export type NotificationCategory =
  | 'all'
  | 'Pending Review'
  | 'Approval'
  | 'Rejection'
  | 'AI Processing'
  | 'Report Generated'
  | 'System'
  | 'Placement'
  | 'Internship'
  | 'Achievement';

export type NotificationPriority = 'all' | 'high' | 'medium' | 'low';

export type NotificationDateFilter = 'all' | 'today' | 'week' | 'month';

export interface NotificationFilterState {
  search: string;
  read: NotificationReadFilter;
  category: NotificationCategory;
  priority: NotificationPriority;
  date: NotificationDateFilter;
  page: number;
  limit: number;
  sortBy: NotificationQueryParams['sortBy'];
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_NOTIFICATION_FILTERS: NotificationFilterState = {
  search: '',
  read: 'all',
  category: 'all',
  priority: 'all',
  date: 'all',
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  'Pending Review',
  'Approval',
  'Rejection',
  'AI Processing',
  'Report Generated',
  'System',
  'Placement',
  'Internship',
  'Achievement',
];

export type NotificationTimeGroup = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Older';
