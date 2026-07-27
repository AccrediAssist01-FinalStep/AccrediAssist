'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { searchService, type SearchRequest } from '@/services/search.service';
import type { GlobalSearchResponse } from '@/types/api-models';

export function useSmartSearch() {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['search-status'],
    queryFn: () => searchService.getStatus(),
    staleTime: 5 * 60_000,
  });

  const searchMutation = useMutation({
    mutationFn: (payload: SearchRequest) => searchService.globalSearch(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['search-history'] });
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Search failed. Please try again.');
    },
  });

  return {
    statusQuery,
    searchMutation,
    results: searchMutation.data as GlobalSearchResponse | undefined,
    isSearching: searchMutation.isPending,
    isError: searchMutation.isError,
    search: searchMutation.mutate,
    searchAsync: searchMutation.mutateAsync,
    reset: searchMutation.reset,
  };
}
