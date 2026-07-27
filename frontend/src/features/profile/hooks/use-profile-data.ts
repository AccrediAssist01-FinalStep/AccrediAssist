'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { searchService } from '@/services/search.service';
import { authService } from '@/services/auth.service';
import type { User } from '@/types';
import {
  mapDashboardActivity,
  mapSearchHistory,
  type ProfileActivityItem,
} from '../utils/profile.utils';

export function useProfileData(userId?: string) {
  return useQuery({
    queryKey: ['profile-data', userId],
    queryFn: async () => {
      const [profile, activitiesResult, searchHistory] = await Promise.all([
        authService.getProfile(),
        dashboardService.getRecentActivities(30),
        searchService.getHistory(1, 8),
      ]);

      const userActivities = activitiesResult.activities
        .filter((activity) => !userId || activity.userId === userId)
        .map(mapDashboardActivity);

      const searchActivities = searchHistory.items.map(mapSearchHistory);

      const activities: ProfileActivityItem[] = [...userActivities, ...searchActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 12);

      return {
        profile: profile as User,
        activities,
      };
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
