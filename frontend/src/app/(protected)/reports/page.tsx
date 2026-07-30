'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageTransition } from '@/components/layout/PageLayout';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ReportsIllustration } from '@/components/illustrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { pendingReviewService } from '@/services/pending-review.service';
import { useQuery } from '@tanstack/react-query';
import {
  AIReportPanel,
  AiEventReportsDashboard,
  DEFAULT_REPORTS_FILTERS,
  GenerateReportDialog,
  QuickReportCards,
  REPORT_TEMPLATES,
  ReportHistoryTable,
  ReportPreviewDrawer,
  ReportsFiltersBarWithActions,
  ReportsHeader,
  useReportDetail,
  useReportHistory,
  useReportMutations,
  type ReportTemplate,
  type ReportsFilterState,
} from '@/features/reports';
import type { GenerateReportPayload, ReportExportFormat, ReportRecord } from '@/types/api-models';

export default function ReportsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportsFilterState>(DEFAULT_REPORTS_FILTERS);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<ReportRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatingTemplateId, setGeneratingTemplateId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [trackingReportId, setTrackingReportId] = useState<string | null>(null);

  const historyQuery = useReportHistory(filters);
  const allReportsQuery = useReportHistory({ ...DEFAULT_REPORTS_FILTERS, limit: 50 });
  const aiPendingQuery = useQuery({
    queryKey: ['ai-event-pending-records'],
    queryFn: () =>
      pendingReviewService.list({
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    staleTime: 30_000,
  });
  const { generateMutation, downloadMutation, deleteMutation } = useReportMutations();
  const trackingQuery = useReportDetail(trackingReportId, Boolean(trackingReportId));

  const reports = historyQuery.data?.items ?? [];
  const allReports = allReportsQuery.data?.items ?? [];
  const latestReport = allReports[0];

  const updateFilters = useCallback((patch: Partial<ReportsFilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const handleGenerateClick = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setGenerateOpen(true);
  };

  const handleGenerate = async (payload: GenerateReportPayload) => {
    if (!selectedTemplate) return;

    setGeneratingTemplateId(selectedTemplate.id);
    try {
      const report = await generateMutation.mutateAsync(payload);
      setGenerateOpen(false);
      setPreviewReport(report);
      setPreviewOpen(true);

      if (!report.downloadReady) {
        setTrackingReportId(report._id);
      }

      await historyQuery.refetch();
      await allReportsQuery.refetch();
    } finally {
      setGeneratingTemplateId(null);
    }
  };

  const handleDownload = async (report: ReportRecord, _format?: ReportExportFormat) => {
    setDownloadingId(report._id);
    try {
      await downloadMutation.mutateAsync(report._id);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (report: ReportRecord) => {
    if (!window.confirm(`Delete "${report.reportTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(report._id);
    try {
      await deleteMutation.mutateAsync(report._id);
      if (previewReport?._id === report._id) {
        setPreviewOpen(false);
        setPreviewReport(null);
      }
      await historyQuery.refetch();
      await allReportsQuery.refetch();
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = (report: ReportRecord) => {
    setPreviewReport(report);
    setPreviewOpen(true);
  };

  useEffect(() => {
    if (!trackingReportId || !trackingQuery.data) return;

    const { status, downloadReady } = trackingQuery.data;

    if (status === 'failed') {
      setTrackingReportId(null);
      setPreviewReport(trackingQuery.data);
      toast.error(trackingQuery.data.errorMessage ?? 'Report generation failed');
      void historyQuery.refetch();
      return;
    }

    if (downloadReady || status === 'completed') {
      setTrackingReportId(null);
      setPreviewReport(trackingQuery.data);
      void historyQuery.refetch();
      void allReportsQuery.refetch();
    }
  }, [trackingQuery.data, trackingReportId, historyQuery, allReportsQuery]);

  useEffect(() => {
    if (!previewOpen || !previewReport?._id || !trackingReportId) return;
    if (trackingQuery.data && trackingQuery.data._id === previewReport._id) {
      setPreviewReport(trackingQuery.data);
    }
  }, [previewOpen, previewReport?._id, trackingReportId, trackingQuery.data]);

  const showEmptyHistory = !historyQuery.isLoading && !historyQuery.isError && reports.length === 0;
  const isInitialLoading = historyQuery.isLoading && !historyQuery.data;

  return (
    <PageTransition>
      <ReportsHeader />

      {allReportsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <QuickReportCards
          templates={REPORT_TEMPLATES}
          reports={allReports}
          onGenerate={handleGenerateClick}
          onPreview={handlePreview}
          generatingTemplateId={generatingTemplateId}
        />
      )}

      <AIReportPanel latestReport={latestReport} isLoading={allReportsQuery.isLoading} />

      <AiEventReportsDashboard
        records={aiPendingQuery.data?.items ?? []}
        isLoading={aiPendingQuery.isLoading}
      />

      <ReportsFiltersBarWithActions
        filters={filters}
        onChange={updateFilters}
        onRefresh={() => historyQuery.refetch()}
        isRefreshing={historyQuery.isFetching}
      />

      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyQuery.isError ? (
            <ErrorState title="Unable to load report history" onRetry={() => historyQuery.refetch()} />
          ) : showEmptyHistory ? (
            <EmptyState
              illustration={<ReportsIllustration className="mx-auto size-40" />}
              title="No reports generated yet."
              description="Choose a report template above and click Generate to create your first AI-powered institutional report."
            />
          ) : (
            <ReportHistoryTable
              reports={reports}
              isLoading={isInitialLoading}
              page={historyQuery.data?.meta.page ?? filters.page}
              totalPages={historyQuery.data?.meta.totalPages ?? 1}
              onPageChange={(page) => updateFilters({ page })}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onDelete={handleDelete}
              downloadingId={downloadingId}
              deletingId={deletingId}
              currentUserId={user?._id}
            />
          )}
        </CardContent>
      </Card>

      <GenerateReportDialog
        template={selectedTemplate}
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerate={handleGenerate}
        isGenerating={generateMutation.isPending}
      />

      <ReportPreviewDrawer
        report={previewReport}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onDownload={handleDownload}
        isDownloading={downloadingId === previewReport?._id}
      />
    </PageTransition>
  );
}
