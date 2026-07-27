'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/layout/AppShell';
import { ChartSkeleton, StatCardsSkeleton } from '@/components/common/LoadingSkeletons';
import { ErrorState } from '@/components/common/ErrorState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardService } from '@/services/dashboard.service';

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
      <div className="space-y-8">
        <StatCardsSkeleton count={4} />
        <ChartSkeleton />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Deep insights into accreditation metrics and institutional performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Students', value: summary?.totalStudents },
          { label: 'Placements', value: summary?.totalPlacements },
          { label: 'Publications', value: summary?.totalPublications },
          { label: 'Pending Reviews', value: summary?.pendingReviews },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value?.toLocaleString() ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Current month record distribution across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#2563EB" fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
