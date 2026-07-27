'use client';

import { motion } from 'framer-motion';
import { FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ReportsHeader() {
  return (
    <section className="space-y-3" aria-labelledby="reports-center-heading">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="size-3" aria-hidden="true" />
          AI Report Generation
        </Badge>
      </div>
      <h1 id="reports-center-heading" className="text-3xl font-bold tracking-tight md:text-4xl">
        Reports Center
      </h1>
      <p className="max-w-3xl text-muted">
        Generate AI-powered institutional reports for accreditation and administration.
      </p>
      <div className="flex items-center gap-2 text-sm text-muted">
        <FileText className="size-4" aria-hidden="true" />
        PDF and DOCX exports supported when generation completes
      </div>
    </section>
  );
}
