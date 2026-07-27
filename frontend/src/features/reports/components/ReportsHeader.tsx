'use client';

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FeaturePageHeader } from '@/components/layout/PageLayout';

export function ReportsHeader() {
  return (
    <FeaturePageHeader
      id="reports-center-heading"
      title="Reports Center"
      description="Generate AI-powered institutional reports for accreditation and administration. PDF and DOCX exports supported when generation completes."
      badge={
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="size-3" aria-hidden="true" />
          AI Report Generation
        </Badge>
      }
    />
  );
}
