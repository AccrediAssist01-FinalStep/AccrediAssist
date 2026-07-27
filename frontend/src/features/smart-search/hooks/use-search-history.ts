'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { searchService } from '@/services/search.service';
import {
  clearDismissedHistoryIds,
  dismissHistoryId,
  getDismissedHistoryIds,
} from '../utils/smart-search.utils';

export function useSearchHistory() {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ['search-history'],
    queryFn: () => searchService.getHistory(1, 20),
    staleTime: 30_000,
  });

  const clearMutation = useMutation({
    mutationFn: () => searchService.clearHistory(),
    onSuccess: async (deletedCount) => {
      clearDismissedHistoryIds();
      toast.success(deletedCount > 0 ? 'Search history cleared' : 'No history to clear');
      await queryClient.invalidateQueries({ queryKey: ['search-history'] });
    },
    onError: () => toast.error('Failed to clear search history'),
  });

  const dismiss = (id: string) => {
    dismissHistoryId(id);
    void queryClient.invalidateQueries({ queryKey: ['search-history'] });
    toast.success('Removed from recent searches');
  };

  const dismissedIds = getDismissedHistoryIds();
  const visibleItems =
    historyQuery.data?.items.filter((item) => !dismissedIds.includes(item._id)) ?? [];

  return {
    historyQuery,
    items: visibleItems,
    isLoading: historyQuery.isLoading,
    clearAll: () => clearMutation.mutate(),
    isClearing: clearMutation.isPending,
    dismiss,
  };
}
