'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reportService } from '@/services/report.service';
import type { GenerateReportPayload, ReportQueryParams } from '@/types/api-models';
import type { ReportsFilterState } from '../types';
import { DEFAULT_REPORTS_FILTERS } from '../types';
import { filterReportsByStatus } from '../utils/reports.utils';

function toQueryParams(filters: ReportsFilterState): ReportQueryParams {
  return {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    reportType: filters.reportType === 'all' ? undefined : filters.reportType,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

export function useReportHistory(filters: ReportsFilterState = DEFAULT_REPORTS_FILTERS) {
  return useQuery({
    queryKey: ['report-history', filters],
    queryFn: async () => {
      const result = await reportService.list(toQueryParams(filters));
      return {
        ...result,
        items: filterReportsByStatus(result.items, filters.status),
      };
    },
    staleTime: 30_000,
  });
}

export function useReportDetail(id: string | null, poll = false) {
  return useQuery({
    queryKey: ['report-detail', id],
    queryFn: () => reportService.getById(id!),
    enabled: Boolean(id),
    refetchInterval: poll ? 3000 : false,
    staleTime: 10_000,
  });
}

export function useReportMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['report-history'] });
    await queryClient.invalidateQueries({ queryKey: ['report-detail'] });
  };

  const generateMutation = useMutation({
    mutationFn: (payload: GenerateReportPayload) => reportService.generate(payload),
    onSuccess: async (report) => {
      toast.success('Report generation started');
      await invalidate();
      return report;
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to generate report');
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => reportService.getDownloadInfo(id),
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Download unavailable. Report may still be generating.');
    },
  });

  return {
    generateMutation,
    downloadMutation,
    isMutating: generateMutation.isPending || downloadMutation.isPending,
  };
}
