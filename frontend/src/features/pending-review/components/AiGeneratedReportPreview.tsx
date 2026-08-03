'use client';

import { Badge } from '@/components/ui/badge';
import type { PendingRecord } from '@/types/api-models';

interface AiGeneratedReportPreviewProps {
  record: PendingRecord;
}

interface WorkshopStructuredReport {
  departmentName?: string | null;
  reportTitle?: string | null;
  eventDetails?: {
    title?: string | null;
    organizedBy?: string | null;
    resourcePerson?: string | null;
    headOfDepartment?: string | null;
    venue?: string | null;
    date?: string | null;
    time?: string | null;
    participants?: string | null;
  };
  introduction?: string[];
  objectives?: string[];
  workshopProceedings?: string[];
  topicsCovered?: string[];
  scheduleSummary?: string[];
  learningOutcomes?: string[];
  keyHighlights?: string[];
  benefits?: string[];
  conclusion?: string[];
  acknowledgement?: string[];
  aiExecutiveSummary?: string;
  imagePlacements?: Array<{ imageReference: string; section: string; caption: string }>;
  missingFields?: string[];
}

const renderSection = (heading: string, content: string[] | undefined) => {
  if (!content?.length) return null;
  return (
    <section key={heading} className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{heading}</h4>
      {content.map((paragraph, index) => (
        <p key={`${heading}-${index}`} className="text-sm leading-relaxed text-muted-foreground">
          {paragraph}
        </p>
      ))}
    </section>
  );
};

const renderListSection = (heading: string, items: string[] | undefined) => {
  if (!items?.length) return null;
  return (
    <section key={heading} className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{heading}</h4>
      <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
        {items.map((item, index) => (
          <li key={`${heading}-${index}`}>{item}</li>
        ))}
      </ol>
    </section>
  );
};

export function AiGeneratedReportPreview({ record }: AiGeneratedReportPreviewProps) {
  const data = record.extractedData ?? {};
  const structured = data.workshopReportStructured as WorkshopStructuredReport | undefined;
  const report =
    (typeof data.aiGeneratedReport === 'string' && data.aiGeneratedReport) ||
    (typeof data.description === 'string' && data.description) ||
    '';
  const missingFields = Array.isArray(structured?.missingFields)
    ? structured.missingFields
    : Array.isArray(data.missingFields)
      ? data.missingFields
      : [];
  const evidence = Array.isArray(data.evidence) ? data.evidence : [];

  if (!report && !structured && data.sourceType !== 'ai-event-report') {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          AI Generated Report
        </h3>
        {typeof data.reportType === 'string' && <Badge variant="outline">{data.reportType}</Badge>}
        {structured && <Badge variant="secondary">Template-aligned structure</Badge>}
        {typeof data.validationNotes === 'string' && (
          <Badge variant="secondary">{data.validationNotes.slice(0, 60)}</Badge>
        )}
      </div>

      {structured ? (
        <div className="max-h-[520px] space-y-4 overflow-y-auto rounded-md border border-border bg-card/80 p-4">
          <div className="space-y-1 text-center">
            {structured.departmentName && (
              <p className="text-lg font-semibold text-foreground">{structured.departmentName}</p>
            )}
            {structured.reportTitle && (
              <p className="text-base font-medium text-foreground">{structured.reportTitle}</p>
            )}
          </div>

          {structured.eventDetails && (
            <section className="space-y-1 border-t border-border pt-3">
              <h4 className="text-sm font-semibold text-foreground">Event Details :</h4>
              <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                {[
                  ['Title of the Event', structured.eventDetails.title],
                  ['Organized By', structured.eventDetails.organizedBy],
                  ['Resource Person', structured.eventDetails.resourcePerson],
                  ['Head of Department', structured.eventDetails.headOfDepartment],
                  ['Venue', structured.eventDetails.venue],
                  ['Date', structured.eventDetails.date],
                  ['Time', structured.eventDetails.time],
                  ['Participants', structured.eventDetails.participants],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-medium text-foreground">{label}</dt>
                    <dd>{value ?? 'Not available in evidence'}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {renderSection('Introduction', structured.introduction)}
          {renderListSection('Objectives', structured.objectives)}
          {renderSection('Workshop Proceedings', structured.workshopProceedings)}
          {renderListSection('Topics Covered', structured.topicsCovered)}
          {renderListSection('Schedule Summary', structured.scheduleSummary)}
          {renderListSection('Learning Outcomes', structured.learningOutcomes)}
          {renderListSection('Key Highlights', structured.keyHighlights)}
          {renderListSection('Benefits', structured.benefits)}
          {renderSection('Conclusion', structured.conclusion)}
          {structured.aiExecutiveSummary && renderSection('AI Executive Summary', [structured.aiExecutiveSummary])}
          {renderSection('Acknowledgement', structured.acknowledgement)}

          {structured.imagePlacements && structured.imagePlacements.length > 0 && (
            <section className="space-y-2 border-t border-border pt-3">
              <h4 className="text-sm font-semibold text-foreground">Image Placements</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {structured.imagePlacements.map((placement) => (
                  <li key={placement.imageReference}>
                    {placement.imageReference} → {placement.section}: {placement.caption}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : report ? (
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
