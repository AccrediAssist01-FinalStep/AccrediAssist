'use client';

import { Badge } from '@/components/ui/badge';
import type { PendingRecord } from '@/types/api-models';

interface AiGeneratedReportPreviewProps {
  record: PendingRecord;
}

export function AiGeneratedReportPreview({ record }: AiGeneratedReportPreviewProps) {
  const data = record.extractedData ?? {};
  const report =
    (typeof data.aiGeneratedReport === 'string' && data.aiGeneratedReport) ||
    (typeof data.description === 'string' && data.description) ||
    '';
  const missingFields = Array.isArray(data.missingFields) ? data.missingFields : [];
  const evidence = Array.isArray(data.evidence) ? data.evidence : [];

  if (!report && data.sourceType !== 'ai-event-report') {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          AI Generated Report
        </h3>
        {typeof data.reportType === 'string' && <Badge variant="outline">{data.reportType}</Badge>}
        {typeof data.validationNotes === 'string' && (
          <Badge variant="secondary">{data.validationNotes.slice(0, 60)}</Badge>
        )}
      </div>

      {report ? (
        <div className="max-h-[420px] overflow-y-auto rounded-md border border-border bg-card/80 p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {report}
          </pre>
        </div>
      ) : (
        <p className="text-sm text-muted">AI report narrative is not available yet.</p>
      )}

      {missingFields.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Missing Information
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {missingFields.join(', ')} — not found in WhatsApp evidence.
          </p>
        </div>
      )}

      {evidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Linked Evidence ({evidence.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {evidence.map((item, index) => {
              const evidenceItem = item as {
                label?: string;
                url?: string;
                type?: string;
                observation?: string;
              };
              return (
                <div key={`${evidenceItem.label ?? index}`} className="rounded-md border border-border bg-card/60 p-3">
                  <p className="text-sm font-medium">{evidenceItem.label ?? `Evidence ${index + 1}`}</p>
                  <p className="text-xs capitalize text-muted">{evidenceItem.type ?? 'file'}</p>
                  {evidenceItem.observation && (
                    <p className="mt-1 text-xs text-muted-foreground">{evidenceItem.observation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
