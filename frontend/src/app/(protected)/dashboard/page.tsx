'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Award,
  Briefcase,
  ClipboardCheck,
  GraduationCap,
  BookOpen,
  Lightbulb,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartSkeleton, PageHeaderSkeleton, StatCardsSkeleton } from '@/components/common/LoadingSkeletons';
import { ErrorState } from '@/components/common/ErrorState';
import { DashboardIllustration } from '@/components/illustrations';
import { useAuth } from '@/providers/AuthProvider';
import { dashboardService } from '@/services/dashboard.service';

const statConfig = [
  { key: 'totalStudents', label: 'Total Students', icon: Users, color: 'text-primary' },
  { key: 'totalPlacements', label: 'Placements', icon: Briefcase, color: 'text-success' },
  { key: 'totalInternships', label: 'Internships', icon: GraduationCap, color: 'text-secondary' },
  { key: 'pendingReviews', label: 'Pending Reviews', icon: ClipboardCheck, color: 'text-warning' },
  { key: 'totalFacultyAchievements', label: 'Faculty Achievements', icon: Award, color: 'text-primary' },
  { key: 'totalPublications', label: 'Publications', icon: BookOpen, color: 'text-success' },
  { key: 'totalPatents', label: 'Patents', icon: Lightbulb, color: 'text-secondary' },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();

  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardService.getSummary,
  });

  const { data: monthlyStats } = useQuery({
    queryKey: ['dashboard-monthly', now.getFullYear(), now.getMonth() + 1],
    queryFn: () => dashboardService.getMonthlyStatistics(now.getFullYear(), now.getMonth() + 1),
  });

  const { data: activities } = useQuery({
    queryKey: ['dashboard-activities'],
    queryFn: () => dashboardService.getRecentActivities(5),
  });

  const chartData = monthlyStats
    ? [
        { name: 'Placements', value: monthlyStats.placements },
        { name: 'Internships', value: monthlyStats.internships },
        { name: 'Achievements', value: monthlyStats.studentAchievements + monthlyStats.facultyAchievements },
        { name: 'Publications', value: monthlyStats.publications },
        { name: 'Patents', value: monthlyStats.patents },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
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
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'User'}`}
        description="Here's an overview of your accreditation data and recent activity."
        action={<Badge variant="secondary">{user?.role}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statConfig.slice(0, 4).map((stat, index) => {
          const Icon = stat.icon;
          const value = summary?.[stat.key as keyof typeof summary] ?? 0;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <div className={`rounded-lg bg-accent p-2 ${stat.color}`}>
                    <Icon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{value.toLocaleString()}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>Record activity for the current month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card)',
                  }}
                />
                <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities?.activities.length ? (
              activities.activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 rounded-lg border border-border p-3">
                  <Badge variant="outline" className="shrink-0">
                    {activity.action}
                  </Badge>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{activity.module}</p>
                    <p className="truncate text-xs text-muted">{activity.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <DashboardIllustration className="size-24 opacity-60" />
                <p className="mt-2 text-sm text-muted">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
