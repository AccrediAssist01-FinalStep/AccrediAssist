'use client';

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportExecutiveSummary } from '@/types/api-models';

interface ReportSummaryPanelProps {
  summary?: ReportExecutiveSummary | null;
  fallbackSummary: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function ReportSummaryPanel({
  summary,
  fallbackSummary,
  isLoading,
  isError,
}: ReportSummaryPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <Skeleton className="mb-3 h-5 w-32" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
      <div className="flex flex-wrap items-center gap-2 font-medium">
        <Sparkles className="size-4 text-primary" />
        AI Executive Summary
        {summary?.source && (
          <Badge variant="outline" className="font-normal">
            {summary.source === 'gemini' ? 'Gemini AI' : 'Rule-based fallback'}
          </Badge>
        )}
      </div>

      {isError || !summary ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">{fallbackSummary}</p>
      ) : (
        <div className="mt-3 space-y-4 text-sm">
          <p className="leading-relaxed text-foreground">{summary.executiveSummary}</p>

          {summary.keyHighlights.length > 0 && (
            <div>
              <p className="mb-2 font-medium">Key Highlights</p>
              <ul className="list-disc space-y-1 pl-5 text-muted">
                {summary.keyHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.strengths.length > 0 && (
            <div>
              <p className="mb-2 font-medium">Strengths</p>
              <ul className="list-disc space-y-1 pl-5 text-muted">
                {summary.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.recommendations.length > 0 && (
            <div>
              <p className="mb-2 font-medium">Recommendations</p>
              <ul className="list-disc space-y-1 pl-5 text-muted">
                {summary.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
