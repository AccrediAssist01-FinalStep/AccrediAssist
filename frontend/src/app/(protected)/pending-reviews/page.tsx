'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_FILTERS,
  PendingRecordDrawer,
  PendingRecordList,
  PendingReviewFiltersBar,
  PendingReviewHeader,
  usePendingRecord,
  usePendingRecords,
  usePendingReviewStats,
  type PendingReviewFilters,
} from '@/features/pending-review';
import { PageTransition } from '@/components/layout/PageLayout';
import type { PendingRecord } from '@/types/api-models';

export default function PendingReviewsPage() {
  const [filters, setFilters] = useState<PendingReviewFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const statsQuery = usePendingReviewStats();
  const listQuery = usePendingRecords(filters);
  const detailQuery = usePendingRecord(selectedId);

  const updateFilters = useCallback((patch: Partial<PendingReviewFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const handleSelect = (record: PendingRecord) => {
    setSelectedId(record._id);
    setDrawerOpen(true);
  };

  const handleRefresh = useCallback(() => {
    void statsQuery.refetch();
    void listQuery.refetch();
    if (selectedId) void detailQuery.refetch();
  }, [statsQuery, listQuery, detailQuery, selectedId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'r' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        handleRefresh();
      }

      if (event.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, handleRefresh]);

  const records = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;

  return (
    <PageTransition>
      <PendingReviewHeader stats={statsQuery.data} isLoading={statsQuery.isLoading} />

      <PendingReviewFiltersBar
        filters={filters}
        onChange={updateFilters}
        onRefresh={handleRefresh}
        isRefreshing={listQuery.isFetching || statsQuery.isFetching}
      />

      <PendingRecordList
        records={records}
        selectedId={selectedId}
        onSelect={handleSelect}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        onRetry={() => listQuery.refetch()}
        page={meta?.page ?? filters.page}
        totalPages={meta?.totalPages ?? 1}
        onPageChange={(page) => updateFilters({ page })}
      />

      <PendingRecordDrawer
        record={detailQuery.data ?? records.find((record) => record._id === selectedId) ?? null}
        isLoading={detailQuery.isLoading && !detailQuery.data}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onActionComplete={handleRefresh}
      />

      {(listQuery.isFetching || statsQuery.isFetching) && !listQuery.isLoading && (
        <p className="text-center text-xs text-muted" aria-live="polite">
          Refreshing review queue...
        </p>
      )}
    </PageTransition>
  );
}
