'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock3, Sparkles, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { PendingReviewHeaderStats } from '../types';

interface PendingReviewHeaderProps {
  stats?: PendingReviewHeaderStats;
  isLoading?: boolean;
}

const statConfig = [
  { key: 'totalPending' as const, label: 'Total Pending', icon: Clock3, accent: 'from-amber-500/20 to-orange-500/5' },
  { key: 'approvedToday' as const, label: 'Approved Today', icon: CheckCircle2, accent: 'from-emerald-500/20 to-green-500/5' },
  { key: 'rejectedToday' as const, label: 'Rejected Today', icon: XCircle, accent: 'from-red-500/20 to-rose-500/5' },
  { key: 'averageConfidence' as const, label: 'Average AI Confidence', icon: Sparkles, accent: 'from-violet-500/20 to-purple-500/5' },
];

export function PendingReviewHeader({ stats, isLoading }: PendingReviewHeaderProps) {
  return (
    <section className="space-y-6" aria-labelledby="pending-review-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 id="pending-review-heading" className="text-3xl font-bold tracking-tight">
              Pending Review
            </h1>
            <Badge variant="warning">Review Queue</Badge>
          </div>
          <p className="max-w-2xl text-muted">
            Review AI extracted records before approving them into the ERP database.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statConfig.map((stat, index) => {
          const Icon = stat.icon;
          const value =
            stat.key === 'averageConfidence'
              ? stats?.averageConfidence != null
                ? `${stats.averageConfidence}%`
                : '—'
              : (stats?.[stat.key] ?? 0).toLocaleString();

          return (
            <motion.article
              key={stat.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl border border-border bg-gradient-to-br ${stat.accent} p-5 shadow-soft`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-lg bg-card/80 p-2 ring-1 ring-border/50">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="mt-4 h-8 w-16" />
              ) : (
                <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
              )}
              <p className="mt-1 text-sm font-medium">{stat.label}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
