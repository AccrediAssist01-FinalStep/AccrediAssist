'use client';

import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { FeaturePageHeader, PageTransition, SectionCard } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/common/Table';
import { createDefaultFeatureFilters, type FeatureRecord, type FeatureRecordConfig } from '../types';
import { useFeatureRecord, useFeatureRecords } from '../hooks/use-feature-records';
import { formatRecordValue } from '../utils/format-record-value';
import { FeatureRecordsFiltersBar } from './FeatureRecordsFiltersBar';
import { RecordDetailDrawer } from './RecordDetailDrawer';

interface FeatureRecordsViewProps {
  config: FeatureRecordConfig;
}

export function FeatureRecordsView({ config }: FeatureRecordsViewProps) {
  const [filters, setFilters] = useState(() => createDefaultFeatureFilters(config.apiPath));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setFilters(createDefaultFeatureFilters(config.apiPath));
    setSelectedId(null);
    setDrawerOpen(false);
  }, [config.apiPath, config.id]);

  const updateFilters = useCallback((patch: Partial<typeof filters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const listQuery = useFeatureRecords(config, filters);
  const detailQuery = useFeatureRecord(config, selectedId);

  const handleRefresh = useCallback(() => {
    void listQuery.refetch();
    if (selectedId) void detailQuery.refetch();
  }, [listQuery, detailQuery, selectedId]);

  const handleSelect = (record: FeatureRecord) => {
    setSelectedId(record._id);
    setDrawerOpen(true);
  };

  const records = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;

  return (
    <PageTransition>
      <FeaturePageHeader
        title={config.title}
        description={config.description}
        meta={
          meta ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {meta.total.toLocaleString()} records
              {filters.year !== 'all' ? ` · ${filters.year}` : ''}
            </span>
          ) : undefined
        }
      />

      <SectionCard contentClassName="space-y-4">
        <FeatureRecordsFiltersBar
          apiPath={config.apiPath}
          filters={filters}
          searchPlaceholder={config.searchPlaceholder}
          onChange={updateFilters}
          onRefresh={handleRefresh}
          isRefreshing={listQuery.isFetching}
        />

        {listQuery.isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : listQuery.isError ? (
          <ErrorState title={`Unable to load ${config.title.toLowerCase()}`} onRetry={handleRefresh} />
        ) : records.length === 0 ? (
          <EmptyState
            title={`No ${config.title.toLowerCase()} yet`}
            description={
              filters.search || filters.year !== 'all'
                ? 'Try changing the year filter or search keywords.'
                : 'Approved records will appear here after WhatsApp auto-review.'
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {config.columns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow
                    key={record._id}
                    className="cursor-pointer"
                    onClick={() => handleSelect(record)}
                  >
                    {config.columns.map((column) => (
                      <TableCell key={column.key} className="max-w-[240px] truncate">
                        {formatRecordValue(record[column.key], column.format)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              page={meta?.page ?? filters.page}
              totalPages={meta?.totalPages ?? 1}
              onPageChange={(page) => updateFilters({ page })}
            />
          </>
        )}
      </SectionCard>

      <RecordDetailDrawer
        record={detailQuery.data ?? records.find((record) => record._id === selectedId) ?? null}
        columns={config.columns}
        title={config.title}
        apiPath={config.apiPath}
        configId={config.id}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        isLoading={detailQuery.isLoading && !detailQuery.data}
        onSaved={handleRefresh}
      />
    </PageTransition>
  );
}
