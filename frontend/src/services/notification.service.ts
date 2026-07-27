import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type { NotificationItem } from '@/types/api-models';

export const notificationService = {
  getNotifications: async (page = 1, limit = 10): Promise<{ items: NotificationItem[]; meta: { total: number; totalPages: number } }> => {
    const { data } = await apiClient.get<ApiResponse<{ items: NotificationItem[]; meta: { total: number; totalPages: number } }>>(
      '/notifications',
      { params: { page, limit } },
    );
    return data.data!;
  },
};
