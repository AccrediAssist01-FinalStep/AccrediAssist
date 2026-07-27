'use client';

import { BrainCircuit, Filter, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { GlobalSearchResponse } from '@/types/api-models';
import { formatCollectionLabel } from '../utils/smart-search.utils';

interface SearchUnderstandingBannerProps {
  response: GlobalSearchResponse;
}

export function SearchUnderstandingBanner({ response }: SearchUnderstandingBannerProps) {
  const { understanding } = response;
  const filterEntries = Object.entries(response.filters ?? {}).filter(
    ([, value]) => value != null && value !== '',
  );

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-violet-500/5 to-cyan-500/5">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" />
              {understanding.source === 'gemini' ? 'Gemini AI' : 'Structured Search'}
            </Badge>
            {understanding.collection && (
              <Badge>{formatCollectionLabel(understanding.collection)}</Badge>
            )}
            {understanding.confidence != null && (
              <Badge variant="success">{understanding.confidence}% confidence</Badge>
            )}
          </div>
          <p className="text-sm text-muted">
            Interpreted “<span className="font-medium text-foreground">{response.query}</span>”
            {understanding.model ? ` using ${understanding.model}` : ''}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <BrainCircuit className="size-4 text-primary" aria-hidden="true" />
          <span className="font-medium">{response.meta.total} results</span>
          {filterEntries.length > 0 && (
            <span className="flex items-center gap-1 text-muted">
              <Filter className="size-3.5" />
              {filterEntries.map(([key, value]) => `${key}: ${String(value)}`).join(', ')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
