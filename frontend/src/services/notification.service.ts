import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type {
  NotificationItem,
  NotificationListResponse,
  NotificationQueryParams,
} from '@/types/api-models';

export const notificationService = {
  list: async (params: NotificationQueryParams = {}): Promise<NotificationListResponse> => {
    const query: Record<string, string | number | undefined> = {
      page: params.page,
      limit: params.limit,
      search: params.search,
      type: params.type,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };

    if (params.isRead !== undefined) {
      query.isRead = params.isRead ? 'true' : 'false';
    }

    const { data } = await apiClient.get<ApiResponse<NotificationListResponse>>('/notifications', {
      params: query,
    });
    return data.data!;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const { data } = await apiClient.put<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
    return data.data!;
  },

  markAllAsRead: async (): Promise<number> => {
    const unread = await notificationService.list({ isRead: false, limit: 100, page: 1 });
    if (unread.items.length === 0) return 0;

    await Promise.all(unread.items.map((item) => notificationService.markAsRead(item._id)));
    return unread.items.length;
  },

  getUnreadCount: async (): Promise<number> => {
    const { meta } = await notificationService.list({ page: 1, limit: 1 });
    return meta.unreadCount;
  },
};
