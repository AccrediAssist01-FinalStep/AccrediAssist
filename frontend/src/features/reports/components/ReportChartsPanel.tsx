'use client';

import {
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
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportChartItem } from '@/types/api-models';

const CHART_COLORS = ['#2563EB', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DB2777'];

interface ReportChartsPanelProps {
  charts?: ReportChartItem[];
  isLoading?: boolean;
  isError?: boolean;
}

function toChartRows(chart: ReportChartItem) {
  return chart.labels.map((label, index) => {
    const row: Record<string, string | number> = { label };
    chart.datasets.forEach((dataset) => {
      row[dataset.label] = dataset.data[index] ?? 0;
    });
    return row;
  });
}

function toPieRows(chart: ReportChartItem) {
  const dataset = chart.datasets[0];
  if (!dataset) return [];
  return chart.labels.map((label, index) => ({
    name: label,
    value: dataset.data[index] ?? 0,
  }));
}

function ReportChartCard({ chart }: { chart: ReportChartItem }) {
  const title = chart.metadata?.title ?? chart.datasets[0]?.label ?? 'Chart';
  const rows = toChartRows(chart);

  if (chart.chartType === 'pie' || chart.chartType === 'doughnut') {
    const pieRows = toPieRows(chart);
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieRows} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieRows.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  if (chart.chartType === 'line') {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {chart.datasets.map((dataset, index) => (
                <Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {chart.datasets.map((dataset, index) => (
              <Bar
                key={dataset.label}
                dataKey={dataset.label}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ReportChartsPanel({ charts, isLoading, isError }: ReportChartsPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !charts || charts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-accent/20 p-6 text-center">
        <BarChart3 className="mx-auto size-8 text-muted" />
        <p className="mt-2 text-sm font-medium">Charts unavailable</p>
        <p className="mt-1 text-sm text-muted">
          Charts will appear here once report data is available or open the PDF preview below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
        <BarChart3 className="size-4" />
        Analytics Charts ({charts.length})
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {charts.map((chart, index) => (
          <ReportChartCard key={`${chart.metadata?.title ?? 'chart'}-${index}`} chart={chart} />
        ))}
      </div>
    </div>
  );
}
