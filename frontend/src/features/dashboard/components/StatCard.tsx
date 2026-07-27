'use client';

import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStatItem } from '../types';

const STAT_GRADIENTS: Record<string, string> = {
  pendingReviews: 'from-amber-500/20 to-orange-500/5',
  studentAchievements: 'from-blue-500/20 to-cyan-500/5',
  facultyAchievements: 'from-violet-500/20 to-purple-500/5',
  placements: 'from-emerald-500/20 to-green-500/5',
  internships: 'from-indigo-500/20 to-blue-500/5',
  publications: 'from-sky-500/20 to-blue-500/5',
  patents: 'from-fuchsia-500/20 to-purple-500/5',
  eventReports: 'from-teal-500/20 to-emerald-500/5',
};

interface StatCardProps {
  stat: DashboardStatItem;
  icon: LucideIcon;
  index: number;
}

export function StatCard({ stat, icon: Icon, index }: StatCardProps) {
  const trend = stat.trend;
  const TrendIcon = trend === null || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor =
    trend === null || trend === 0 ? 'text-muted' : trend > 0 ? 'text-success' : 'text-danger';

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-elevated',
        'bg-gradient-to-br',
        STAT_GRADIENTS[stat.id] ?? 'from-primary/10 to-transparent',
      )}
      aria-label={`${stat.label}: ${stat.value}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-lg bg-card/80 p-2.5 shadow-soft ring-1 ring-border/50">
          <Icon className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
          <TrendIcon className="size-3.5" aria-hidden="true" />
          {trend === null ? '—' : `${trend > 0 ? '+' : ''}${trend}%`}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight">{stat.value.toLocaleString()}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{stat.label}</p>
        <p className="mt-0.5 text-xs text-muted">{stat.trendLabel}</p>
      </div>
    </motion.article>
  );
}
