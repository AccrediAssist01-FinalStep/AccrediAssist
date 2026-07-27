'use client';

import { motion } from 'framer-motion';
import { Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportRecord } from '@/types/api-models';
import type { ReportTemplate } from '../types';
import { formatShortReportDate } from '../utils/reports.utils';

interface QuickReportCardProps {
  template: ReportTemplate;
  latestReport?: ReportRecord;
  index: number;
  onGenerate: (template: ReportTemplate) => void;
  onPreview: (report: ReportRecord) => void;
  isGenerating?: boolean;
}

export function QuickReportCard({
  template,
  latestReport,
  index,
  onGenerate,
  onPreview,
  isGenerating,
}: QuickReportCardProps) {
  const Icon = template.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className={`group overflow-hidden rounded-xl border border-border bg-gradient-to-br ${template.accent} shadow-soft transition-shadow hover:shadow-elevated`}
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-card/80 p-3 ring-1 ring-border/50">
              <Icon className="size-5 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">{template.title}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">{template.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted">
            {latestReport
              ? `Last generated ${formatShortReportDate(latestReport.generatedDate)}`
              : 'No recent generation'}
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={() => onGenerate(template)}
              isLoading={isGenerating}
            >
              <Sparkles className="size-4" />
              Generate
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              disabled={!latestReport}
              onClick={() => latestReport && onPreview(latestReport)}
              aria-label={`Preview ${template.title}`}
            >
              <Eye className="size-4" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.article>
  );
}

interface QuickReportCardsProps {
  templates: ReportTemplate[];
  reports: ReportRecord[];
  onGenerate: (template: ReportTemplate) => void;
  onPreview: (report: ReportRecord) => void;
  generatingTemplateId?: string | null;
}

export function QuickReportCards({
  templates,
  reports,
  onGenerate,
  onPreview,
  generatingTemplateId,
}: QuickReportCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {templates.map((template, index) => {
        const latestReport = reports.find((report) => report.reportType === template.backendReportType);
        return (
          <QuickReportCard
            key={template.id}
            template={template}
            latestReport={latestReport}
            index={index}
            onGenerate={onGenerate}
            onPreview={onPreview}
            isGenerating={generatingTemplateId === template.id}
          />
        );
      })}
    </div>
  );
}
