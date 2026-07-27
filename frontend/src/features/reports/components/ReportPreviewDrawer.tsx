'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Download, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ReportExportFormat, ReportRecord } from '@/types/api-models';
import { useReportFilePreview, useReportPreviewInsights } from '../hooks/use-reports';
import { SECTION_LABELS } from '../types';
import { ReportChartsPanel } from './ReportChartsPanel';
import { ReportSummaryPanel } from './ReportSummaryPanel';
import {
  buildReportSummary,
  formatFileSize,
  formatReportDate,
  getFilterEntries,
  getReportFormat,
  getReportProgress,
  getReportQuality,
  getReportStatus,
  getStatusBadgeVariant,
  getStatusLabel,
  isGenerationReportType,
} from '../utils/reports.utils';

interface ReportPreviewDrawerProps {
  report: ReportRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (report: ReportRecord, format?: ReportExportFormat) => void;
  isDownloading?: boolean;
}

export function ReportPreviewDrawer({
  report,
  open,
  onOpenChange,
  onDownload,
  isDownloading,
}: ReportPreviewDrawerProps) {
  const status = report ? getReportStatus(report) : 'pending';
  const format = report ? getReportFormat(report) : 'unknown';
  const isPdf = format === 'pdf';
  const canPreviewFile = Boolean(report?.downloadReady && status === 'ready');
  const showInsights = Boolean(report && isGenerationReportType(report.reportType) && status === 'ready');

  const insightsQuery = useReportPreviewInsights(report?._id ?? null, report?.reportType, open && showInsights);
  const previewQuery = useReportFilePreview(report?._id ?? null, isPdf, open && canPreviewFile && isPdf);

  useEffect(() => {
    return () => {
      if (previewQuery.data) {
        URL.revokeObjectURL(previewQuery.data);
      }
    };
  }, [previewQuery.data]);

  if (!report) return null;

  const quality = getReportQuality(report);
  const filters = getFilterEntries(report);
  const progress = getReportProgress(report);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-4xl">
        <SheetHeader className="border-b border-border px-6 py-5">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <Badge variant="outline">{report.reportType}</Badge>
            <Badge variant={getStatusBadgeVariant(status)}>{getStatusLabel(status)}</Badge>
            {report.exportFormat && <Badge variant="success">{report.exportFormat.toUpperCase()}</Badge>}
            {report.fileSizeBytes != null && (
              <Badge variant="outline">{formatFileSize(report.fileSizeBytes)}</Badge>
            )}
          </div>
          <SheetTitle className="text-left">{report.reportTitle}</SheetTitle>
          <SheetDescription className="text-left">
            Generated {formatReportDate(report.generatedDate)}
            {report.pageCount ? ` · ${report.pageCount} pages` : ''}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-9rem)]">
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 p-6"
          >
            {status === 'failed' && (
              <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" />
                <div>
                  <p className="font-medium text-danger">Generation failed</p>
                  <p className="mt-1 text-sm text-muted">
                    {report.errorMessage ?? 'An error occurred while generating this report.'}
                  </p>
                </div>
              </div>
            )}

            {status === 'processing' && (
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Loader2 className="size-4 animate-spin text-warning" />
                  Generating report…
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-accent">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted">{progress}% complete</p>
              </div>
            )}

            <ReportSummaryPanel
              summary={insightsQuery.data?.summary}
              fallbackSummary={buildReportSummary(report)}
              isLoading={showInsights && insightsQuery.isLoading}
              isError={insightsQuery.isError}
            />

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Quality {quality.score}%</Badge>
              <Badge variant="outline">{quality.label}</Badge>
              {report.sectionsIncluded?.map((section) => (
                <Badge key={section} variant="outline">
                  {SECTION_LABELS[section] ?? section}
                </Badge>
              ))}
            </div>

            {showInsights && (
              <ReportChartsPanel
                charts={insightsQuery.data?.charts?.charts}
                isLoading={insightsQuery.isLoading}
                isError={insightsQuery.isError}
              />
            )}

            {canPreviewFile && isPdf ? (
              previewQuery.isLoading ? (
                <Skeleton className="h-[480px] w-full rounded-xl" />
              ) : previewQuery.isError ? (
                <div className="rounded-xl border border-dashed border-border bg-accent/30 p-8 text-center">
                  <FileText className="mx-auto size-10 text-muted" />
                  <p className="mt-3 font-medium">PDF preview unavailable</p>
                  <p className="mt-1 text-sm text-muted">Use the download button to open the report.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <iframe
                    src={previewQuery.data}
                    title={report.reportTitle}
                    className="h-[480px] w-full bg-white"
                  />
                </div>
              )
            ) : canPreviewFile && format === 'docx' ? (
              <div className="rounded-xl border border-border bg-card/60 p-6 text-center">
                <FileText className="mx-auto size-10 text-primary" />
                <p className="mt-3 font-medium">DOCX Document Ready</p>
                <p className="mt-1 text-sm text-muted">
                  Preview is best in Microsoft Word or Google Docs. Download to open the document.
                </p>
              </div>
            ) : status !== 'failed' ? (
              <div className="rounded-xl border border-dashed border-border bg-accent/30 p-8 text-center">
                <FileText className="mx-auto size-10 text-muted" />
                <p className="mt-3 font-medium">Document preview unavailable</p>
                <p className="mt-1 text-sm text-muted">
                  {status === 'processing'
                    ? 'The formatted report will appear here once generation completes.'
                    : 'Generate with PDF or DOCX format to create a downloadable document.'}
                </p>
              </div>
            ) : null}

            {filters.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Applied Filters</h3>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <tbody>
                      {filters.map((filter) => (
                        <tr key={filter.label} className="border-b border-border last:border-0">
                          <td className="bg-accent/30 px-4 py-3 font-medium">{filter.label}</td>
                          <td className="px-4 py-3 text-muted">{filter.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </ScrollArea>

        <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-card p-4">
          <Button
            onClick={() => onDownload(report, 'pdf')}
            disabled={!report.downloadReady || format !== 'pdf'}
            isLoading={isDownloading && format === 'pdf'}
          >
            <Download className="size-4" />
            Download PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => onDownload(report, 'docx')}
            disabled={!report.downloadReady || format !== 'docx'}
            isLoading={isDownloading && format === 'docx'}
          >
            <Download className="size-4" />
            Download DOCX
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
