'use client';

import { useDashboardData } from '@/features/dashboard/hooks/use-dashboard-data';
import { DashboardHero } from '@/features/dashboard/components/DashboardHero';
import { StatsGrid } from '@/features/dashboard/components/StatsGrid';
import { AIInsightsPanel } from '@/features/dashboard/components/AIInsightsPanel';
import { DashboardCharts } from '@/features/dashboard/components/DashboardCharts';
import { RecentActivityTimeline } from '@/features/dashboard/components/RecentActivityTimeline';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
import { ChartSkeleton, StatCardsSkeleton } from '@/components/common/LoadingSkeletons';
import { ErrorState } from '@/components/common/ErrorState';

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDashboardData();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-48 animate-pulse rounded-2xl bg-accent" />
        <StatCardsSkeleton count={8} />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} title="Dashboard unavailable" />;
  }

  return (
    <div className="space-y-8 pb-4">
      <DashboardHero />

      <StatsGrid stats={data.stats} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AIInsightsPanel
            summary={data.summary}
            currentMonth={data.currentMonth}
            activities={data.activities}
          />
        </div>
        <QuickActions />
      </div>

      <DashboardCharts monthlyTrend={data.monthlyTrend} currentMonth={data.currentMonth} />

      <RecentActivityTimeline activities={data.activities} />

      {isFetching && (
        <p className="text-center text-xs text-muted" aria-live="polite">
          Refreshing dashboard data...
        </p>
      )}
    </div>
  );
}
