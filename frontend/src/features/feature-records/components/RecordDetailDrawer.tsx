'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeatureColumn, FeatureRecord } from '../types';
import { formatRecordValue } from '../utils/format-record-value';

interface RecordDetailDrawerProps {
  record: FeatureRecord | null;
  columns: FeatureColumn[];
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
}

function getDetailFields(record: FeatureRecord, columns: FeatureColumn[]) {
  const columnKeys = new Set(columns.map((column) => column.key));
  const extraKeys = Object.keys(record).filter(
    (key) => !columnKeys.has(key) && !['_id', '__v'].includes(key),
  );

  const extraColumns: FeatureColumn[] = extraKeys.map((key) => ({
    key,
    label: key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (char) => char.toUpperCase()),
    format: Array.isArray(record[key]) ? 'list' : key.toLowerCase().includes('date') ? 'date' : 'text',
  }));

  return [...columns, ...extraColumns];
}

export function RecordDetailDrawer({
  record,
  columns,
  title,
  open,
  onOpenChange,
  isLoading,
}: RecordDetailDrawerProps) {
  const fields = record ? getDetailFields(record, columns) : columns;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Full record details</DialogDescription>
        </DialogHeader>

        {isLoading && !record ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : record ? (
          <dl className="space-y-3">
            {fields.map((field) => (
              <div key={field.key} className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">{field.label}</dt>
                <dd className="mt-1 text-sm text-foreground break-words">
                  {formatRecordValue(record[field.key], field.format)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
