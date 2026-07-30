'use client';

import { motion } from 'framer-motion';
import { Bot, Clock3, FileText, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PendingRecord } from '@/types/api-models';

export interface AiEventReportDashboardStats {
  totalAiReports: number;
  pendingAiReports: number;
  workshopReports: number;
  industrialVisitReports: number;
  averageConfidence: number | null;
}

interface AiEventReportsDashboardProps {
  records: PendingRecord[];
  isLoading?: boolean;
}

function computeStats(records: PendingRecord[]): AiEventReportDashboardStats {
  const aiRecords = records.filter((record) => record.extractedData?.sourceType === 'ai-event-report');
  const pending = aiRecords.filter(
    (record) => record.status === 'Pending' || record.status === 'Needs Review',
  );
  const workshopReports = aiRecords.filter((record) => record.category === 'Workshop').length;
  const industrialVisitReports = aiRecords.filter(
    (record) => record.category === 'Industrial Visit',
  ).length;
  const averageConfidence =
    aiRecords.length > 0
      ? Math.round(aiRecords.reduce((sum, record) => sum + record.confidenceScore, 0) / aiRecords.length)
      : null;

  return {
    totalAiReports: aiRecords.length,
    pendingAiReports: pending.length,
    workshopReports,
    industrialVisitReports,
    averageConfidence,
  };
}

const statCards = [
  { key: 'totalAiReports' as const, label: 'Total AI Reports', icon: FileText },
  { key: 'pendingAiReports' as const, label: 'Pending AI Review', icon: Clock3 },
  { key: 'workshopReports' as const, label: 'Workshop Reports', icon: Bot },
  { key: 'averageConfidence' as const, label: 'Average AI Confidence', icon: Sparkles },
];

export function AiEventReportsDashboard({ records, isLoading }: AiEventReportsDashboardProps) {
  const stats = computeStats(records);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          AI Event Report Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const value =
              stat.key === 'averageConfidence'
                ? stats.averageConfidence != null
                  ? `${stats.averageConfidence}%`
                  : '—'
                : stats[stat.key].toLocaleString();

            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-xl border border-border bg-card/70 p-4"
              >
                <div className="mb-3 rounded-lg bg-primary/10 p-2 w-fit">
                  <Icon className="size-4 text-primary" />
                </div>
                {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{value}</p>}
                <p className="mt-1 text-sm text-muted">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
        {!isLoading && stats.industrialVisitReports > 0 && (
          <p className="mt-4 text-sm text-muted">
            Industrial visit AI reports: {stats.industrialVisitReports}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { computeStats as computeAiEventReportStats };
