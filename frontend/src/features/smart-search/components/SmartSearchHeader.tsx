'use client';

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FeaturePageHeader } from '@/components/layout/PageLayout';

interface SmartSearchHeaderProps {
  geminiConfigured?: boolean;
  model?: string;
}

export function SmartSearchHeader({ geminiConfigured, model }: SmartSearchHeaderProps) {
  return (
    <FeaturePageHeader
      id="smart-search-heading"
      title="Smart Search"
      description="Search institutional data using natural language."
      badge={
        <>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" aria-hidden="true" />
            AI-Powered
          </Badge>
          {geminiConfigured === false && <Badge variant="warning">Structured mode only</Badge>}
          {model && <Badge variant="outline">{model}</Badge>}
        </>
      }
    />
  );
}
