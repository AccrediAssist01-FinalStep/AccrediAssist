'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { FeaturePageHeader, PageTransition, SectionCard } from '@/components/layout/PageLayout';
import { ChartSkeleton, PageHeaderSkeleton, StatCardsSkeleton } from '@/components/common/LoadingSkeletons';
import { ErrorState } from '@/components/common/ErrorState';
import { CardDescription } from '@/components/ui/card';
import { dashboardService } from '@/services/dashboard.service';

const AnalyticsCategoryChart = dynamic(
  () =>
    import('@/features/analytics/components/AnalyticsCategoryChart').then((module) => ({
      default: module.AnalyticsCategoryChart,
    })),
  { loading: () => <ChartSkeleton /> },
);

export default function AnalyticsPage() {
  const year = new Date().getFullYear();

  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: dashboardService.getSummary,
  });

  const { data: monthlyStats } = useQuery({
    queryKey: ['analytics-monthly', year, new Date().getMonth() + 1],
    queryFn: () => dashboardService.getMonthlyStatistics(year, new Date().getMonth() + 1),
  });

  const trendData = monthlyStats
    ? [
        { category: 'Placements', count: monthlyStats.placements },
        { category: 'Internships', count: monthlyStats.internships },
        { category: 'Students', count: monthlyStats.studentAchievements },
        { category: 'Faculty', count: monthlyStats.facultyAchievements },
        { category: 'Publications', count: monthlyStats.publications },
        { category: 'Patents', count: monthlyStats.patents },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="space-y-8 pb-8">
        <PageHeaderSkeleton />
        <StatCardsSkeleton count={4} />
        <ChartSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Analytics unavailable"
        message="We couldn't load analytics data. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  const stats = [
    { label: 'Total Students', value: summary?.totalStudents },
    { label: 'Placements', value: summary?.totalPlacements },
    { label: 'Publications', value: summary?.totalPublications },
    { label: 'Pending Reviews', value: summary?.pendingReviews },
  ];

  return (
    <PageTransition>
      <FeaturePageHeader
        id="analytics-heading"
        title="Analytics"
        description="Deep insights into accreditation metrics and institutional performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <SectionCard key={stat.label} contentClassName="py-5">
            <CardDescription className="text-sm">{stat.label}</CardDescription>
            <p className="mt-2 text-3xl font-bold tracking-tight">{stat.value?.toLocaleString() ?? 0}</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Category Distribution"
        description="Current month record distribution across categories"
        contentClassName="pt-0"
      >
        {trendData.length > 0 ? (
          <AnalyticsCategoryChart data={trendData} />
        ) : (
          <ChartSkeleton />
        )}
      </SectionCard>
    </PageTransition>
  );
}
