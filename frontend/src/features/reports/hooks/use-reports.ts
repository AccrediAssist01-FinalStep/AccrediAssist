'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reportGenerationService, reportService } from '@/services/report.service';
import type { GenerateReportPayload, ReportQueryParams } from '@/types/api-models';
import type { ReportsFilterState } from '../types';
import { DEFAULT_REPORTS_FILTERS } from '../types';
import {
  buildPreviewFileName,
  downloadReportBlob,
  isGenerationReportType,
  mapStatusFilterToBackend,
  triggerFileDownload,
} from '../utils/reports.utils';

function toQueryParams(filters: ReportsFilterState): ReportQueryParams {
  return {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    reportType: filters.reportType === 'all' ? undefined : filters.reportType,
    format: filters.format === 'all' ? undefined : filters.format,
    status: mapStatusFilterToBackend(filters.status),
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

export function useReportHistory(filters: ReportsFilterState = DEFAULT_REPORTS_FILTERS) {
  return useQuery({
    queryKey: ['report-history', filters],
    queryFn: () => reportService.list(toQueryParams(filters)),
    staleTime: 30_000,
  });
}

export function useReportDetail(id: string | null, poll = false) {
  return useQuery({
    queryKey: ['report-detail', id],
    queryFn: () => reportService.getById(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      if (!poll) return false;
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 3000;
    },
    staleTime: 10_000,
  });
}

export function useReportPreviewInsights(reportId: string | null, reportType?: string, enabled = false) {
  return useQuery({
    queryKey: ['report-preview-insights', reportId],
    queryFn: async () => {
      const report = await reportService.getById(reportId!);
      if (!isGenerationReportType(report.reportType)) {
        return { summary: null, charts: null };
      }

      const filters = report.filtersApplied ?? {};
      const [summary, charts] = await Promise.all([
        reportGenerationService.getSummary(report.reportType, filters),
        reportGenerationService.getCharts(report.reportType, filters),
      ]);

      return { summary, charts };
    },
    enabled: Boolean(reportId) && enabled && Boolean(reportType) && isGenerationReportType(reportType ?? ''),
    staleTime: 120_000,
    retry: 1,
  });
}

export function useReportFilePreview(reportId: string | null, isPdf: boolean, enabled: boolean) {
  return useQuery({
    queryKey: ['report-file-preview', reportId],
    queryFn: async () => {
      const blob = await reportService.downloadFile(reportId!);
      return URL.createObjectURL(blob);
    },
    enabled: Boolean(reportId) && isPdf && enabled,
    staleTime: 60_000,
  });
}

export function useReportMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['report-history'] });
    await queryClient.invalidateQueries({ queryKey: ['report-detail'] });
    await queryClient.invalidateQueries({ queryKey: ['report-preview-insights'] });
    await queryClient.invalidateQueries({ queryKey: ['report-file-preview'] });
  };

  const getErrorMessage = (error: unknown): string | undefined => {
    if (error && typeof error === 'object' && 'response' in error) {
      return (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    }
    return undefined;
  };

  const generateMutation = useMutation({
    mutationFn: (payload: GenerateReportPayload) => reportService.generate(payload),
    onSuccess: async (report) => {
      const message =
        report.downloadReady ? 'Report generated successfully' : 'Report generation started';
      toast.success(message);
      await invalidate();
      return report;
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to generate report');
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const info = await reportService.getDownloadInfo(reportId);
      if (info.downloadUrl.startsWith('http')) {
        await triggerFileDownload(info.downloadUrl, info.fileName);
        return info;
      }

      const blob = await reportService.downloadFile(reportId);
      await downloadReportBlob(blob, info.fileName);
      return info;
    },
    onSuccess: (info) => {
      toast.success(`Downloaded ${info.fileName}`);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Download unavailable. Report may still be generating.');
    },
  });

  const downloadBlobMutation = useMutation({
    mutationFn: async ({ reportId, fileName }: { reportId: string; fileName: string }) => {
      const blob = await reportService.downloadFile(reportId);
      await downloadReportBlob(blob, fileName);
    },
    onSuccess: (_, variables) => {
      toast.success(`Downloaded ${variables.fileName}`);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to download report file.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportService.delete(id),
    onSuccess: async () => {
      toast.success('Report deleted');
      await invalidate();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to delete report');
    },
  });

  return {
    generateMutation,
    downloadMutation,
    downloadBlobMutation,
    deleteMutation,
    isMutating:
      generateMutation.isPending ||
      downloadMutation.isPending ||
      downloadBlobMutation.isPending ||
      deleteMutation.isPending,
  };
}

export { buildPreviewFileName };
