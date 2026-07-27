'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PendingRecord } from '@/types/api-models';
import { ConfidenceBadge } from './ConfidenceBadge';
import {
  formatSubmittedDate,
  getRecordDepartment,
  getRecordTitle,
  getStatusBadgeVariant,
  hasAttachments,
} from '../utils/pending-review.utils';

interface PendingRecordCardProps {
  record: PendingRecord;
  index: number;
  isSelected?: boolean;
  onSelect: (record: PendingRecord) => void;
}

export function PendingRecordCard({ record, index, isSelected, onSelect }: PendingRecordCardProps) {
  const title = getRecordTitle(record);
  const department = getRecordDepartment(record);
  const attachments = hasAttachments(record);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      onClick={() => onSelect(record)}
      className={cn(
        'group w-full rounded-xl border border-border bg-card p-5 text-left shadow-soft transition-all hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'border-primary ring-2 ring-primary/20',
      )}
      aria-label={`Review ${title}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{record.category}</Badge>
            <Badge variant={getStatusBadgeVariant(record.status)}>{record.status}</Badge>
            {attachments && (
              <Badge variant="secondary" className="gap-1">
                <Paperclip className="size-3" aria-hidden="true" />
                Attachments
              </Badge>
            )}
          </div>

          <h3 className="truncate text-base font-semibold tracking-tight">{title}</h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span>{department}</span>
            <span>{formatSubmittedDate(record.createdAt)}</span>
            {record.senderName && <span>From {record.senderName}</span>}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <ConfidenceBadge score={record.confidenceScore} />
          <div className="flex items-center gap-1 text-xs text-muted">
            <MessageCircle className="size-3.5" aria-hidden="true" />
            WhatsApp
          </div>
        </div>
      </div>
    </motion.button>
  );
}
