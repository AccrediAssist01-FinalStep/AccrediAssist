'use client';

import dynamic from 'next/dynamic';
import { useDashboardData } from '@/features/dashboard/hooks/use-dashboard-data';
import { DashboardHero } from '@/features/dashboard/components/DashboardHero';
import { ErpModuleOverview } from '@/features/dashboard/components/ErpModuleOverview';
import {
  AccreditationProgressPanel,
  KeyMetricsRow,
  PendingReviewsHighlight,
  WhatsAppActivityPanel,
} from '@/features/dashboard/components/ErpDashboardPanels';
import { AIInsightsPanel } from '@/features/dashboard/components/AIInsightsPanel';
import { RecentActivityTimeline } from '@/features/dashboard/components/RecentActivityTimeline';
import { PageTransition, SectionCard } from '@/components/layout/PageLayout';
import { ChartSkeleton, PageHeaderSkeleton } from '@/components/common/LoadingSkeletons';
import { ErrorState } from '@/components/common/ErrorState';

const DashboardCharts = dynamic(
  () =>
    import('@/features/dashboard/components/DashboardCharts').then((module) => ({
      default: module.DashboardCharts,
    })),
  { loading: () => <ChartSkeleton /> },
);

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDashboardData();

  if (isLoading) {
    return (
      <div className="space-y-8 pb-8">
        <PageHeaderSkeleton />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-2xl bg-accent" />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} title="Dashboard unavailable" />;
  }

  return (
    <PageTransition>
      <DashboardHero />

      <ErpModuleOverview
        summary={data.summary}
        yearly={data.yearly}
        pendingReviews={data.summary.pendingReviews}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <PendingReviewsHighlight summary={data.summary} />
          <KeyMetricsRow summary={data.summary} />
          <SectionCard title="Monthly Analytics" description="Activity trends across all ERP modules">
            <DashboardCharts monthlyTrend={data.monthlyTrend} currentMonth={data.currentMonth} />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <AIInsightsPanel
            summary={data.summary}
            currentMonth={data.currentMonth}
            activities={data.activities}
          />
          <AccreditationProgressPanel />
          <WhatsAppActivityPanel activities={data.activities} />
        </div>
      </div>

      <RecentActivityTimeline activities={data.activities} />

      {isFetching && (
        <p className="text-center text-xs text-muted" aria-live="polite">
          Refreshing dashboard data...
        </p>
      )}
    </PageTransition>
  );
}
