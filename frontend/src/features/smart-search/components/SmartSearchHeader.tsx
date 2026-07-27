'use client';

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SmartSearchHeaderProps {
  geminiConfigured?: boolean;
  model?: string;
}

export function SmartSearchHeader({ geminiConfigured, model }: SmartSearchHeaderProps) {
  return (
    <section className="space-y-3 text-center" aria-labelledby="smart-search-heading">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="size-3" aria-hidden="true" />
          AI-Powered
        </Badge>
        {geminiConfigured === false && <Badge variant="warning">Structured mode only</Badge>}
        {model && <Badge variant="outline">{model}</Badge>}
      </div>
      <h1 id="smart-search-heading" className="text-3xl font-bold tracking-tight md:text-4xl">
        Smart Search
      </h1>
      <p className="mx-auto max-w-2xl text-muted">
        Search institutional data using natural language.
      </p>
    </section>
  );
}
