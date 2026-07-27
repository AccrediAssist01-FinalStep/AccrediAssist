'use client';

import { Clock3, Edit3, MessageCircle, UserCheck, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PendingRecord } from '@/types/api-models';
import { formatSubmittedDate } from '../utils/pending-review.utils';

interface PendingRecordTimelineProps {
  record: PendingRecord;
}

export function PendingRecordTimeline({ record }: PendingRecordTimelineProps) {
  const events = [
    {
      id: 'submitted',
      title: 'Submitted via WhatsApp',
      description: record.senderName ? `From ${record.senderName}` : 'Incoming WhatsApp message',
      timestamp: record.createdAt,
      icon: MessageCircle,
      tone: 'default' as const,
    },
    ...(record.extractedData?.aiPipeline
      ? [
          {
            id: 'ai-processed',
            title: 'AI extraction completed',
            description: 'Gemini processed and classified the message',
            timestamp: record.updatedAt,
            icon: Clock3,
            tone: 'default' as const,
          },
        ]
      : []),
    ...(record.editHistory ?? []).map((entry, index) => ({
      id: `edit-${index}`,
      title: 'Faculty edit saved',
      description: `${entry.changes.length} field(s) updated`,
      timestamp: entry.editedAt,
      icon: Edit3,
      tone: 'default' as const,
    })),
    ...(record.reviewedAt && record.status === 'Approved'
      ? [
          {
            id: 'approved',
            title: 'Approved into ERP',
            description: 'Record approved and mapped to target collection',
            timestamp: record.reviewedAt,
            icon: UserCheck,
            tone: 'success' as const,
          },
        ]
      : []),
    ...(record.reviewedAt && record.status === 'Rejected'
      ? [
          {
            id: 'rejected',
            title: 'Rejected',
            description: record.rejectionReason || 'Record rejected by reviewer',
            timestamp: record.reviewedAt,
            icon: XCircle,
            tone: 'danger' as const,
          },
        ]
      : []),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="space-y-4" aria-label="Record timeline">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Timeline</h3>
      <ol className="relative space-y-4 border-l border-border pl-5">
        {events.map((event) => {
          const Icon = event.icon;
          return (
            <li key={event.id} className="relative">
              <span className="absolute -left-[1.35rem] top-1 flex size-6 items-center justify-center rounded-full border border-border bg-card">
                <Icon className="size-3.5 text-primary" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.tone === 'success' && <Badge variant="success">Approved</Badge>}
                  {event.tone === 'danger' && <Badge variant="destructive">Rejected</Badge>}
                </div>
                <p className="text-sm text-muted">{event.description}</p>
                <p className="text-xs text-muted">{formatSubmittedDate(event.timestamp)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
