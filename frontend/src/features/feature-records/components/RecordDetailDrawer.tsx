'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit3, Save, Trash2, X } from 'lucide-react';
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
import { getEditableRecordFields } from '../config/editable-record-fields.config';
import { formatRecordValue } from '../utils/format-record-value';
import { isRecordMediaField } from '../utils/record-media.utils';
import { useFeatureRecordMutations } from '../hooks/use-feature-record-mutations';
import { RecordMediaPreview } from './RecordMediaPreview';
import { buildFormValues, buildRecordPayload } from '../utils/record-form.utils';

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
  onDeleted?: () => void;
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
  onDeleted,
}: RecordDetailDrawerProps) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('pending_records_approve');
  const editableFields = useMemo(() => getEditableRecordFields(apiPath), [apiPath]);
  const { updateMutation, deleteMutation } = useFeatureRecordMutations(configId, apiPath);

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
      setFormValues(buildFormValues(editableFields, record));
    }
  }, [record, editableFields]);

  const handleSave = async () => {
    if (!record) return;
    const payload = buildRecordPayload(formValues, editableFields);
    await updateMutation.mutateAsync({ id: record._id, payload });
    setMode('view');
    onSaved?.();
  };

  const handleDelete = async () => {
    if (!record) return;

    const recordLabel =
      String(record.title ?? record.eventTitle ?? record.studentName ?? record.facultyName ?? 'this record');

    if (!window.confirm(`Delete "${recordLabel}"? This action cannot be undone.`)) {
      return;
    }

    await deleteMutation.mutateAsync(record._id);
    onOpenChange(false);
    onDeleted?.();
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setMode('edit')}>
                  <Edit3 className="size-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
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
                      setFormValues(buildFormValues(editableFields, record));
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
