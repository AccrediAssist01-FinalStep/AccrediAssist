'use client';

import { motion } from 'framer-motion';
import { Download, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ReportRecord } from '@/types/api-models';
import {
  buildReportSummary,
  formatReportDate,
  getFileFormat,
  getFilterEntries,
  getReportQuality,
  getReportStatus,
  getStatusBadgeVariant,
  getStatusLabel,
} from '../utils/reports.utils';

interface ReportPreviewDrawerProps {
  report: ReportRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (report: ReportRecord) => void;
  isDownloading?: boolean;
}

export function ReportPreviewDrawer({
  report,
  open,
  onOpenChange,
  onDownload,
  isDownloading,
}: ReportPreviewDrawerProps) {
  if (!report) return null;

  const status = getReportStatus(report);
  const quality = getReportQuality(report);
  const format = getFileFormat(report.fileUrl);
  const filters = getFilterEntries(report);
  const isPdf = report.fileUrl && format === 'pdf';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border px-6 py-5">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <Badge variant="outline">{report.reportType}</Badge>
            <Badge variant={getStatusBadgeVariant(status)}>{getStatusLabel(status)}</Badge>
            {report.downloadReady && <Badge variant="success">{format.toUpperCase()}</Badge>}
          </div>
          <SheetTitle className="text-left">{report.reportTitle}</SheetTitle>
          <SheetDescription className="text-left">
            Generated {formatReportDate(report.generatedDate)}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 p-6"
          >
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
              <div className="flex items-center gap-2 font-medium">
                <Sparkles className="size-4 text-primary" />
                AI Summary
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{buildReportSummary(report)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">Quality {quality.score}%</Badge>
                <Badge variant="outline">{quality.label}</Badge>
              </div>
            </div>

            {isPdf ? (
              <div className="overflow-hidden rounded-xl border border-border">
                <iframe
                  src={report.fileUrl}
                  title={report.reportTitle}
                  className="h-[480px] w-full bg-white"
                />
              </div>
            ) : report.fileUrl && format === 'docx' ? (
              <div className="rounded-xl border border-border bg-card/60 p-6 text-center">
                <FileText className="mx-auto size-10 text-primary" />
                <p className="mt-3 font-medium">DOCX Document Ready</p>
                <p className="mt-1 text-sm text-muted">
                  Preview is best in Microsoft Word or Google Docs. Download to open the document.
                </p>
                <Button className="mt-4 gap-2" onClick={() => onDownload(report)} isLoading={isDownloading}>
                  <Download className="size-4" />
                  Download DOCX
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-accent/30 p-8 text-center">
                <FileText className="mx-auto size-10 text-muted" />
                <p className="mt-3 font-medium">Document preview unavailable</p>
                <p className="mt-1 text-sm text-muted">
                  AI generation has not completed yet. The formatted report will appear here once ready.
                </p>
              </div>
            )}

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

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Timeline</h3>
              <ol className="relative space-y-4 border-l border-border pl-5">
                <li className="relative">
                  <span className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium">Generation requested</p>
                  <p className="text-xs text-muted">{formatReportDate(report.createdAt)}</p>
                </li>
                <li className="relative">
                  <span className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-violet-500" />
                  <p className="text-sm font-medium">
                    {report.downloadReady ? 'Document generated' : 'Awaiting AI document generation'}
                  </p>
                  <p className="text-xs text-muted">{formatReportDate(report.updatedAt)}</p>
                </li>
              </ol>
            </div>

            {report.fileUrl && (
              <a
                href={report.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Open document in new tab
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </motion.div>
        </ScrollArea>

        <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-card p-4">
          <Button onClick={() => onDownload(report)} disabled={!report.downloadReady} isLoading={isDownloading}>
            <Download className="size-4" />
            Download {report.downloadReady ? format.toUpperCase() : 'Report'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
