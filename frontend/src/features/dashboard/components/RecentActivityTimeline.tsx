'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { DashboardIllustration } from '@/components/illustrations';
import type { DashboardRecentActivity } from '@/types/api-models';
import { formatActivityTime, getActivityTone } from '../utils/dashboard.utils';

interface RecentActivityTimelineProps {
  activities: DashboardRecentActivity[];
}

export function RecentActivityTimeline({ activities }: RecentActivityTimelineProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      aria-label="Recent activity"
    >
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Timeline of approvals, updates, and system events</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <EmptyState
              illustration={<DashboardIllustration className="size-28 opacity-70" />}
              title="No recent activity"
              description="System events and record updates will appear in this timeline."
            />
          ) : (
            <ol className="relative space-y-0 border-l border-border pl-6">
              {activities.map((activity, index) => {
                const tone = getActivityTone(activity.action);
                const badgeVariant =
                  tone === 'success'
                    ? 'success'
                    : tone === 'danger'
                      ? 'destructive'
                      : tone === 'warning'
                        ? 'warning'
                        : 'outline';

                return (
                  <motion.li
                    key={activity.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="relative pb-6 last:pb-0"
                  >
                    <span className="absolute -left-[1.65rem] top-1.5 size-3 rounded-full border-2 border-card bg-primary ring-2 ring-primary/20" />
                    <div className="rounded-xl border border-border/70 bg-accent/30 p-4 transition-colors hover:bg-accent/50">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={badgeVariant}>{activity.action}</Badge>
                        <span className="text-xs text-muted">{activity.module}</span>
                        <span className="ml-auto text-xs text-muted">
                          {formatActivityTime(activity.timestamp)}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="mt-2 text-sm text-foreground">{activity.description}</p>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
}
