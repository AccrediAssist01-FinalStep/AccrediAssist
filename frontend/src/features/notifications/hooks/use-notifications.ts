'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationService } from '@/services/notification.service';
import type { NotificationQueryParams } from '@/types/api-models';
import type { NotificationFilterState } from '../types';
import { DEFAULT_NOTIFICATION_FILTERS } from '../types';
import {
  matchesCategory,
  matchesDateFilter,
  matchesPriority,
} from '../utils/notifications.utils';

function toQueryParams(filters: NotificationFilterState): NotificationQueryParams {
  return {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    isRead:
      filters.read === 'all' ? undefined : filters.read === 'read' ? true : false,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

export function useNotifications(filters: NotificationFilterState = DEFAULT_NOTIFICATION_FILTERS) {
  const usesClientFilters =
    filters.category !== 'all' || filters.priority !== 'all' || filters.date !== 'all';

  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      const result = await notificationService.list(toQueryParams(filters));

      if (!usesClientFilters) return result;

      const filteredItems = result.items.filter(
        (item) =>
          matchesCategory(item, filters.category) &&
          matchesPriority(item, filters.priority) &&
          matchesDateFilter(item, filters.date),
      );

      return {
        ...result,
        items: filteredItems,
      };
    },
    staleTime: 20_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 20_000,
  });
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] }),
    ]);
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: async () => {
      await invalidate();
    },
    onError: () => toast.error('Failed to mark notification as read'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: async (count) => {
      toast.success(count > 0 ? `${count} notifications marked as read` : 'No unread notifications');
      await invalidate();
    },
    onError: () => toast.error('Failed to mark all notifications as read'),
  });

  return {
    markReadMutation,
    markAllReadMutation,
    isMutating: markReadMutation.isPending || markAllReadMutation.isPending,
  };
}
