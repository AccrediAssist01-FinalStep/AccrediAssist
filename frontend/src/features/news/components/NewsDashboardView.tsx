'use client';

import { Newspaper, Sparkles, Users, Building2, Clock3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NewsArticle, NewsDashboardStats } from '@/services/news.service';

interface NewsDashboardViewProps {
  stats: NewsDashboardStats;
  articles?: NewsArticle[];
}

function formatNewsDate(value?: string): string {
  if (!value) return 'Date not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function NewsArticleCard({ article }: { article: NewsArticle }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {article.imageUrl ? (
          <div className="shrink-0 overflow-hidden rounded-lg border border-border sm:w-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt={article.headline}
              className="h-32 w-full object-cover sm:h-full sm:min-h-[120px]"
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium">{article.headline}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {article.newspaperName ?? 'Unknown newspaper'} · {article.articleLanguage}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Published {formatNewsDate(article.publicationDate ?? article.createdAt)}
              </p>
            </div>
            <Badge variant="secondary">{article.articleCategory}</Badge>
          </div>
          {article.summary ? (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{article.summary}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function NewsDashboardView({ stats, articles }: NewsDashboardViewProps) {
  const displayedArticles =
    articles && articles.length > 0 ? articles : stats.recentArticles;
  const statCards = [
    { label: 'Total News Articles', value: stats.totalArticles, icon: Newspaper },
    { label: 'Pending News Reviews', value: stats.pendingReviews, icon: Clock3 },
    { label: 'Student News', value: stats.studentNews, icon: Users },
    { label: 'Faculty News', value: stats.facultyNews, icon: Sparkles },
    { label: 'Department News', value: stats.departmentNews, icon: Building2 },
    { label: 'This Month', value: stats.monthlyCount, icon: Newspaper },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Newspaper Articles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayedArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved news articles yet.</p>
            ) : (
              displayedArticles.map((article) => (
                <NewsArticleCard key={article._id} article={article} />
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly News Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.monthlyAnalytics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No monthly analytics available yet.</p>
              ) : (
                stats.monthlyAnalytics.map((item) => (
                  <div key={item.month} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm font-medium">{item.month}</span>
                    <span className="text-sm text-muted-foreground">{item.count} articles</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Generated News Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.aiInsights.map((insight) => (
                <p key={insight} className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  {insight}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
