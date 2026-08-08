'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import type { FeatureColumn, FeatureRecord } from '../types';
import { getEditableRecordFields, type EditableRecordField } from '../config/editable-record-fields.config';
import { formatRecordValue } from '../utils/format-record-value';
import { isRecordMediaField } from '../utils/record-media.utils';
import { useFeatureRecordMutations } from '../hooks/use-feature-record-mutations';
import { RecordMediaPreview } from './RecordMediaPreview';

interface RecordDetailDrawerProps {
  record: FeatureRecord | null;
  columns: FeatureColumn[];
  title: string;
  apiPath: string;
  configId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
  onSaved?: () => void;
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

  return [...columns, ...extraColumns].filter((field) => !isRecordMediaField(field.key));
}

const toDateInputValue = (value: unknown): string => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const buildFormValues = (
  record: FeatureRecord,
  editableFields: EditableRecordField[],
): Record<string, string> => {
  const values: Record<string, string> = {};
  for (const field of editableFields) {
    const raw = record[field.key];
    if (field.type === 'date') {
      values[field.key] = toDateInputValue(raw);
    } else if (raw == null) {
      values[field.key] = '';
    } else {
      values[field.key] = String(raw);
    }
  }
  return values;
};

const buildUpdatePayload = (
  formValues: Record<string, string>,
  editableFields: EditableRecordField[],
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  for (const field of editableFields) {
    const value = formValues[field.key]?.trim() ?? '';
    if (!value && field.type === 'date') {
      continue;
    }
    if (!value && field.type !== 'date') {
      payload[field.key] = value;
      continue;
    }
    if (field.type === 'date') {
      payload[field.key] = new Date(`${value}T00:00:00.000Z`).toISOString();
    } else {
      payload[field.key] = value;
    }
  }

  return payload;
};

export function RecordDetailDrawer({
  record,
  columns,
  title,
  apiPath,
  configId,
  open,
  onOpenChange,
  isLoading,
  onSaved,
}: RecordDetailDrawerProps) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('pending_records_approve');
  const editableFields = useMemo(() => getEditableRecordFields(apiPath), [apiPath]);
  const { updateMutation } = useFeatureRecordMutations(configId, apiPath);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const fields = record ? getDetailFields(record, columns) : columns;

  useEffect(() => {
    if (!open) {
      setMode('view');
    }
  }, [open]);

  useEffect(() => {
    if (record && editableFields.length > 0) {
      setFormValues(buildFormValues(record, editableFields));
    }
  }, [record, editableFields]);

  const handleSave = async () => {
    if (!record) return;
    const payload = buildUpdatePayload(formValues, editableFields);
    await updateMutation.mutateAsync({ id: record._id, payload });
    setMode('view');
    onSaved?.();
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {mode === 'edit' ? 'Edit record fields and save changes' : 'Full record details'}
              </DialogDescription>
            </div>
            {canEdit && editableFields.length > 0 && record && mode === 'view' ? (
              <Button variant="outline" size="sm" onClick={() => setMode('edit')}>
                <Edit3 className="size-4" />
                Edit
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        {isLoading && !record ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : record ? (
          <div className="space-y-4">
            <RecordMediaPreview record={record} />

            {mode === 'edit' ? (
              <div className="space-y-4">
                {editableFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`edit-${field.key}`}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={`edit-${field.key}`}
                        value={formValues[field.key] ?? ''}
                        onChange={(event) => handleFieldChange(field.key, event.target.value)}
                        rows={4}
                      />
                    ) : field.type === 'select' && field.options ? (
                      <Select
                        value={formValues[field.key] ?? ''}
                        onValueChange={(value) => handleFieldChange(field.key, value)}
                      >
                        <SelectTrigger id={`edit-${field.key}`}>
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`edit-${field.key}`}
                        type={field.type === 'date' ? 'date' : 'text'}
                        value={formValues[field.key] ?? ''}
                        onChange={(event) => handleFieldChange(field.key, event.target.value)}
                      />
                    )}
                  </div>
                ))}

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormValues(buildFormValues(record, editableFields));
                      setMode('view');
                    }}
                    disabled={updateMutation.isPending}
                  >
                    <X className="size-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    <Save className="size-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3">
                {fields.map((field) => (
                  <div key={field.key} className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      {field.label}
                    </dt>
                    <dd className="mt-1 break-words text-sm text-foreground">
                      {formatRecordValue(record[field.key], field.format)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
