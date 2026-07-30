'use client';

import { useQuery } from '@tanstack/react-query';
import { Newspaper } from 'lucide-react';
import { newsService } from '@/services/news.service';
import { NewsDashboardView } from '@/features/news/components/NewsDashboardView';
import { Card, CardContent } from '@/components/ui/card';

export default function NewsPage() {
  const dashboardQuery = useQuery({
    queryKey: ['news-dashboard'],
    queryFn: () => newsService.getDashboard(),
  });

  const articlesQuery = useQuery({
    queryKey: ['news-articles'],
    queryFn: () => newsService.list({ page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const isLoading = dashboardQuery.isLoading || articlesQuery.isLoading;
  const isError = dashboardQuery.isError || articlesQuery.isError;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Newspaper className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">News</h1>
          <p className="text-sm text-muted-foreground">
            Newspaper and magazine article intelligence from WhatsApp intake.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">Loading news dashboard...</CardContent>
        </Card>
      ) : null}

      {isError ? (
        <Card>
          <CardContent className="py-10 text-sm text-destructive">
            Unable to load news dashboard. Refresh the page or sign in again.
          </CardContent>
        </Card>
      ) : null}

      {dashboardQuery.data ? (
        <NewsDashboardView
          stats={dashboardQuery.data}
          articles={articlesQuery.data?.items ?? []}
        />
      ) : null}
    </div>
  );
}
