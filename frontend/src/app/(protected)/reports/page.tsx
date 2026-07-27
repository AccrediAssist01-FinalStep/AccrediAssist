'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageTransition } from '@/components/layout/PageLayout';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ReportsIllustration } from '@/components/illustrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';
import {
  AIReportPanel,
  DEFAULT_REPORTS_FILTERS,
  GenerateReportDialog,
  QuickReportCards,
  REPORT_TEMPLATES,
  ReportHistoryTable,
  ReportPreviewDrawer,
  ReportsFiltersBarWithActions,
  ReportsHeader,
  triggerFileDownload,
  useReportDetail,
  useReportHistory,
  useReportMutations,
  type ReportTemplate,
  type ReportsFilterState,
} from '@/features/reports';
import type { GenerateReportPayload, ReportRecord } from '@/types/api-models';

export default function ReportsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportsFilterState>(DEFAULT_REPORTS_FILTERS);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<ReportRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatingTemplateId, setGeneratingTemplateId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [trackingReportId, setTrackingReportId] = useState<string | null>(null);

  const historyQuery = useReportHistory(filters);
  const allReportsQuery = useReportHistory({ ...DEFAULT_REPORTS_FILTERS, limit: 50 });
  const { generateMutation, downloadMutation } = useReportMutations();
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
      setTrackingReportId(report._id);
      setPreviewReport(report);
      setPreviewOpen(true);
      await historyQuery.refetch();
      await allReportsQuery.refetch();
    } finally {
      setGeneratingTemplateId(null);
    }
  };

  const handleDownload = async (report: ReportRecord) => {
    setDownloadingId(report._id);
    try {
      const info = await downloadMutation.mutateAsync(report._id);
      await triggerFileDownload(info.downloadUrl, info.fileName);
      toast.success(`Downloading ${info.fileName}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = (report: ReportRecord) => {
    setPreviewReport(report);
    setPreviewOpen(true);
  };

  useEffect(() => {
    if (!trackingReportId || !trackingQuery.data) return;
    if (trackingQuery.data.downloadReady) {
      setTrackingReportId(null);
      void historyQuery.refetch();
    }
  }, [trackingQuery.data, trackingReportId, historyQuery]);

  const showEmptyHistory = !historyQuery.isLoading && !historyQuery.isError && reports.length === 0;

  return (
    <PageTransition>
      <ReportsHeader />

      <QuickReportCards
        templates={REPORT_TEMPLATES}
        reports={allReports}
        onGenerate={handleGenerateClick}
        onPreview={handlePreview}
        generatingTemplateId={generatingTemplateId}
      />

      <AIReportPanel latestReport={latestReport} isLoading={allReportsQuery.isLoading} />

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
              isLoading={historyQuery.isLoading}
              page={historyQuery.data?.meta.page ?? filters.page}
              totalPages={historyQuery.data?.meta.totalPages ?? 1}
              onPageChange={(page) => updateFilters({ page })}
              onPreview={handlePreview}
              onDownload={handleDownload}
              downloadingId={downloadingId}
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
