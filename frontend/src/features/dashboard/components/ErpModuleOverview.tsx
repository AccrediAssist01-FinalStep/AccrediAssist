'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Building2, GraduationCap, Users } from 'lucide-react';
import { ERP_MODULES } from '@/config/modules';
import { cn } from '@/lib/utils';
import type { DashboardSummary, DashboardYearlyStatistics } from '@/types/api-models';

interface ErpModuleOverviewProps {
  summary: DashboardSummary;
  yearly: DashboardYearlyStatistics;
  pendingReviews: number;
}

const MODULE_STATS = (
  summary: DashboardSummary,
  yearly: DashboardYearlyStatistics,
  pendingReviews: number,
) => ({
  student: {
    total:
      summary.totalPlacements +
      summary.totalInternships +
      yearly.studentAchievements +
      yearly.eventReports,
    highlights: [
      { label: 'Placements', value: summary.totalPlacements },
      { label: 'Internships', value: summary.totalInternships },
      { label: 'Achievements', value: yearly.studentAchievements },
    ],
  },
  faculty: {
    total:
      summary.totalFacultyAchievements + summary.totalPublications + summary.totalPatents,
    highlights: [
      { label: 'Publications', value: summary.totalPublications },
      { label: 'Patents', value: summary.totalPatents },
      { label: 'Achievements', value: summary.totalFacultyAchievements },
    ],
  },
  department: {
    total: yearly.eventReports,
    highlights: [
      { label: 'Events', value: yearly.eventReports },
      { label: 'Pending AI', value: pendingReviews },
    ],
  },
});

const MODULE_ICONS = {
  student: GraduationCap,
  faculty: Users,
  department: Building2,
};

export function ErpModuleOverview({ summary, yearly, pendingReviews }: ErpModuleOverviewProps) {
  const stats = MODULE_STATS(summary, yearly, pendingReviews);

  return (
    <section aria-label="ERP module overview" className="grid gap-4 lg:grid-cols-3">
      {ERP_MODULES.map((module, index) => {
        const moduleStats = stats[module.id];
        const Icon = MODULE_ICONS[module.id];
        const firstRoute = module.submodules[0]?.route ?? '/dashboard';

        return (
          <motion.article
            key={module.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated',
              'bg-gradient-to-br',
              module.gradient,
            )}
          >
            <Link href={firstRoute} className="absolute inset-0 z-10 rounded-2xl">
              <span className="sr-only">Open {module.label}</span>
            </Link>

            <div className="relative flex items-start justify-between gap-3">
              <div className="rounded-xl bg-card/80 p-3 shadow-soft ring-1 ring-border/50">
                <Icon className="size-6 text-primary" />
              </div>
              <ArrowUpRight className="size-5 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>

            <div className="relative mt-5 space-y-3">
              <div>
                <p className="text-3xl font-bold tracking-tight">{moduleStats.total.toLocaleString()}</p>
                <h2 className="mt-1 text-lg font-semibold">{module.label}</h2>
                <p className="mt-1 text-sm text-muted">{module.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {moduleStats.highlights.map((item) => (
                  <span
                    key={item.label}
                    className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium"
                  >
                    {item.label}: {item.value.toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          </motion.article>
        );
      })}
    </section>
  );
}
