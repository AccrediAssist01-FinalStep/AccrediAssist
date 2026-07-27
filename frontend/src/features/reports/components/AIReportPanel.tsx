'use client';

import { motion } from 'framer-motion';
import { AlertCircle, FileText, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportRecord } from '@/types/api-models';
import {
  buildReportSummary,
  getReportProgress,
  getReportQuality,
  getReportStatus,
  getStatusBadgeVariant,
  getStatusLabel,
} from '../utils/reports.utils';

interface AIReportPanelProps {
  latestReport?: ReportRecord;
  isLoading?: boolean;
}

export function AIReportPanel({ latestReport, isLoading }: AIReportPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!latestReport) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-xl bg-primary/10 p-3">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">AI Report Generation</p>
            <p className="text-sm text-muted">
              Generate your first report to see AI progress and quality insights here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = getReportStatus(latestReport);
  const quality = getReportQuality(latestReport);
  const progress = getReportProgress(latestReport);

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-violet-500/5 to-cyan-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          AI Report Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getStatusBadgeVariant(status)}>{getStatusLabel(status)}</Badge>
              <Badge variant="outline">{latestReport.reportType}</Badge>
              {latestReport.exportFormat && (
                <Badge variant="success">{latestReport.exportFormat.toUpperCase()}</Badge>
              )}
            </div>
            <p className="font-medium">{latestReport.reportTitle}</p>
            <p className="text-sm text-muted">{buildReportSummary(latestReport)}</p>
          </div>

          <div className="rounded-xl border border-border bg-card/70 p-4 lg:min-w-[220px]">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="size-4 text-primary" />
              Report Quality
            </div>
            <p className="mt-2 text-2xl font-bold">{quality.score}%</p>
            <p className="text-xs text-muted">{quality.label}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Generation progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-accent">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${
                status === 'failed'
                  ? 'bg-danger'
                  : 'bg-gradient-to-r from-primary to-violet-500'
              }`}
            />
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-card/60 p-3">
          {status === 'failed' ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
          ) : (
            <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
          )}
          <p className="text-sm text-muted">
            {status === 'ready'
              ? 'Your report document is ready. Preview or download PDF/DOCX from the history table below.'
              : status === 'processing'
                ? 'AI pipeline is running — collecting data, generating summary, charts, and document.'
                : status === 'failed'
                  ? (latestReport.errorMessage ?? 'Report generation failed. Try generating again.')
                  : 'Report request recorded. Select PDF or DOCX format when generating to create a document.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
