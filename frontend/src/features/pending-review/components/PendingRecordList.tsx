'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { NoPendingIllustration } from '@/components/illustrations';
import { Skeleton } from '@/components/ui/skeleton';
import type { PendingRecord } from '@/types/api-models';
import { PendingRecordCard } from './PendingRecordCard';

interface PendingRecordListProps {
  records: PendingRecord[];
  selectedId?: string | null;
  onSelect: (record: PendingRecord) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PendingRecordList({
  records,
  selectedId,
  onSelect,
  isLoading,
  isError,
  onRetry,
  page,
  totalPages,
  onPageChange,
}: PendingRecordListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading pending records">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Unable to load pending records" onRetry={onRetry} />;
  }

  if (records.length === 0) {
    return (
      <EmptyState
        illustration={<NoPendingIllustration className="size-40" />}
        title="No pending records waiting for review."
        description="New WhatsApp submissions processed by Gemini will appear here for faculty approval."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3" role="list" aria-label="Pending review records">
        {records.map((record, index) => (
          <div key={record._id} role="listitem">
            <PendingRecordCard
              record={record}
              index={index}
              isSelected={selectedId === record._id}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
