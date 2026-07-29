'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ClipboardCheck, MessageSquare, ShieldCheck } from 'lucide-react';
import { SectionCard } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import type { DashboardRecentActivity, DashboardSummary } from '@/types/api-models';

interface ErpDashboardPanelsProps {
  summary: DashboardSummary;
  activities: DashboardRecentActivity[];
}

export function PendingReviewsHighlight({ summary }: { summary: DashboardSummary }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-orange-500/5 p-6 shadow-soft"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex rounded-lg bg-card/80 p-2.5">
            <ClipboardCheck className="size-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold">{summary.pendingReviews.toLocaleString()}</p>
          <h3 className="mt-1 font-semibold">Pending AI Reviews</h3>
          <p className="mt-1 text-sm text-muted">WhatsApp submissions awaiting faculty approval</p>
        </div>
        <Button asChild>
          <Link href="/pending-reviews">Review</Link>
        </Button>
      </div>
    </motion.div>
  );
}

export function WhatsAppActivityPanel({ activities }: { activities: DashboardRecentActivity[] }) {
  const whatsappActivities = activities.filter(
    (activity) =>
      activity.module.toLowerCase().includes('pending') ||
      activity.description?.toLowerCase().includes('whatsapp') ||
      activity.action.toLowerCase().includes('approve'),
  );

  const items = whatsappActivities.length > 0 ? whatsappActivities.slice(0, 6) : activities.slice(0, 6);

  return (
    <SectionCard title="Recent WhatsApp Activity" description="Latest AI-processed submissions and approvals">
      <div className="space-y-3">
        {items.map((activity) => (
          <div key={activity.id} className="flex gap-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{activity.action}</p>
              <p className="truncate text-xs text-muted">{activity.description ?? activity.module}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function AccreditationProgressPanel() {
  const frameworks = [
    { name: 'NBA', progress: 72, color: 'from-blue-500 to-cyan-500' },
    { name: 'NAAC', progress: 65, color: 'from-violet-500 to-purple-500' },
    { name: 'AICTE', progress: 58, color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <SectionCard
      title="Accreditation Progress"
      description="Evidence readiness across accreditation frameworks"
      contentClassName="space-y-4"
    >
      {frameworks.map((framework) => (
        <div key={framework.name} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 font-medium">
              <ShieldCheck className="size-4 text-primary" />
              {framework.name}
            </span>
            <span className="text-muted">{framework.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted/40">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${framework.color}`}
              style={{ width: `${framework.progress}%` }}
            />
          </div>
        </div>
      ))}
      <Button asChild variant="outline" size="sm" className="w-full">
        <Link href="/department-activities/accreditation-mapping">View Mapping</Link>
      </Button>
    </SectionCard>
  );
}

export function KeyMetricsRow({ summary }: { summary: DashboardSummary }) {
  const metrics = [
    { label: 'Placements', value: summary.totalPlacements, href: '/student-activities/placement' },
    { label: 'Internships', value: summary.totalInternships, href: '/student-activities/internship' },
    { label: 'Publications', value: summary.totalPublications, href: '/faculty-activities/publications' },
    { label: 'Patents', value: summary.totalPatents, href: '/faculty-activities/patents' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
        >
          <Link
            href={metric.href}
            className="block rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <p className="text-2xl font-bold">{metric.value.toLocaleString()}</p>
            <p className="mt-1 text-sm font-medium text-muted">{metric.label}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
