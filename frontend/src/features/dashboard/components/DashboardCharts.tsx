'use client';

import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import type { DashboardMonthlyStatistics } from '@/types/api-models';
import type { MonthlyTrendPoint } from '../types';
import { MONTH_LABELS } from '../types';

const CHART_COLORS = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

const tooltipStyle = {
  borderRadius: '0.75rem',
  border: '1px solid var(--color-border)',
  background: 'var(--color-card)',
  color: 'var(--color-foreground)',
};

interface DashboardChartsProps {
  monthlyTrend: MonthlyTrendPoint[];
  currentMonth: DashboardMonthlyStatistics;
}

function ChartCard({
  title,
  description,
  children,
  delay = 0,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardCharts({ monthlyTrend, currentMonth }: DashboardChartsProps) {
  const hasTrendData = monthlyTrend.some(
    (point) =>
      point.placements +
        point.internships +
        point.studentAchievements +
        point.facultyAchievements +
        point.publications >
      0,
  );

  const pendingData = [
    { name: 'Pending Reviews', value: currentMonth.pendingReviews },
    {
      name: 'Processed',
      value: Math.max(
        0,
        currentMonth.placements +
          currentMonth.internships +
          currentMonth.studentAchievements +
          currentMonth.facultyAchievements +
          currentMonth.publications +
          currentMonth.patents +
          currentMonth.eventReports,
      ),
    },
  ];

  const distributionData = [
    { name: 'Placements', value: currentMonth.placements },
    { name: 'Internships', value: currentMonth.internships },
    { name: 'Student Ach.', value: currentMonth.studentAchievements },
    { name: 'Faculty Ach.', value: currentMonth.facultyAchievements },
    { name: 'Publications', value: currentMonth.publications },
    { name: 'Patents', value: currentMonth.patents },
  ].filter((item) => item.value > 0);

  const publicationTrend = monthlyTrend.map((point) => ({
    month: point.month,
    publications: point.publications,
  }));

  return (
    <section aria-label="Analytics charts" className="grid gap-6 xl:grid-cols-2">
      <ChartCard title="Monthly Placements" description="Placement activity over the last 6 months" delay={0.1}>
        {hasTrendData ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="placements" fill="#2563EB" radius={[6, 6, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No placement data yet" description="Data will appear as records are added." />
        )}
      </ChartCard>

      <ChartCard title="Student Achievement Trend" description="Monthly student achievements" delay={0.15}>
        {hasTrendData ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="studentAchievements"
                stroke="#7C3AED"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                animationDuration={900}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No achievement data yet" description="Student achievements will chart here." />
        )}
      </ChartCard>

      <ChartCard title="Faculty Achievement Trend" description="Monthly faculty achievements" delay={0.2}>
        {hasTrendData ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="facultyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="facultyAchievements"
                stroke="#10B981"
                fill="url(#facultyGrad)"
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No faculty data yet" description="Faculty achievements will chart here." />
        )}
      </ChartCard>

      <ChartCard title="Pending Review Status" description="Current month review pipeline" delay={0.25}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pendingData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              animationDuration={800}
            >
              {pendingData.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Category Distribution" description="Current month record distribution" delay={0.3}>
        {distributionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distributionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#7C3AED" radius={[0, 6, 6, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No records this month" description="Category distribution will appear with data." />
        )}
      </ChartCard>

      <ChartCard title="Publication Growth" description="Publications over the last 6 months" delay={0.35}>
        {publicationTrend.some((p) => p.publications > 0) ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={publicationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="publications"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                animationDuration={900}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No publication data yet" description="Publication growth will chart here." />
        )}
      </ChartCard>

      <ChartCard
        title="Internship Statistics"
        description={`${MONTH_LABELS[currentMonth.month - 1] ?? ''} ${currentMonth.year} internship activity`}
        delay={0.4}
        >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={[
              { name: 'Internships', value: currentMonth.internships },
              { name: 'Placements', value: currentMonth.placements },
              { name: 'Event Reports', value: currentMonth.eventReports },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#06B6D4" radius={[6, 6, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}
