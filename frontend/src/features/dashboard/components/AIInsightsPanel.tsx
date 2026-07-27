'use client';

import { motion } from 'framer-motion';
import { Sparkles, Bot, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardRecentActivity } from '@/types/api-models';
import type { DashboardMonthlyStatistics, DashboardSummary } from '@/types/api-models';

interface AIInsightsPanelProps {
  summary: DashboardSummary;
  currentMonth: DashboardMonthlyStatistics;
  activities: DashboardRecentActivity[];
}

export function AIInsightsPanel({ summary, currentMonth, activities }: AIInsightsPanelProps) {
  const aiActivities = activities.filter(
    (item) =>
      item.module.toLowerCase().includes('pending') ||
      item.action.toUpperCase().includes('AI') ||
      item.module.toLowerCase().includes('record'),
  );

  const insights = [
    {
      label: 'Pending AI Suggestions',
      value: summary.pendingReviews,
      badge: 'warning' as const,
      icon: Clock,
    },
    {
      label: 'Pending This Month',
      value: currentMonth.pendingReviews,
      badge: 'outline' as const,
      icon: Bot,
    },
    {
      label: 'Recent AI Activity',
      value: aiActivities.length,
      badge: 'secondary' as const,
      icon: Sparkles,
    },
    {
      label: 'Records Processed (Month)',
      value:
        currentMonth.placements +
        currentMonth.internships +
        currentMonth.studentAchievements +
        currentMonth.facultyAchievements,
      badge: 'success' as const,
      icon: CheckCircle2,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      aria-label="AI insights"
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-secondary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Sparkles className="size-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>Intelligence derived from accreditation activity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <div
                key={insight.label}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4 text-muted" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-muted">{insight.label}</p>
                    <p className="text-xl font-bold">{insight.value.toLocaleString()}</p>
                  </div>
                </div>
                <Badge variant={insight.badge}>{insight.value > 0 ? 'Active' : 'Clear'}</Badge>
              </div>
            );
          })}
        </CardContent>

        {summary.pendingReviews > 0 && (
          <div className="mx-6 mb-6 flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            <p className="text-muted">
              <span className="font-medium text-foreground">{summary.pendingReviews} records</span>{' '}
              awaiting review. Confidence scoring is available in the pending reviews module.
            </p>
          </div>
        )}
      </Card>
    </motion.section>
  );
}
