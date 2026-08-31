'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
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
import { toast } from 'sonner';
import { getEditableRecordFields } from '../config/editable-record-fields.config';
import { useFeatureRecordMutations } from '../hooks/use-feature-record-mutations';
import {
  buildFormValues,
  buildRecordPayload,
  validateRequiredFields,
} from '../utils/record-form.utils';

interface RecordCreateDialogProps {
  title: string;
  apiPath: string;
  configId: string;
  listFilters?: Record<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function RecordCreateDialog({
  title,
  apiPath,
  configId,
  listFilters,
  open,
  onOpenChange,
  onCreated,
}: RecordCreateDialogProps) {
  const editableFields = useMemo(() => getEditableRecordFields(apiPath, configId), [apiPath, configId]);
  const { createMutation } = useFeatureRecordMutations(configId, apiPath);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && editableFields.length > 0) {
      setFormValues(buildFormValues(editableFields, listFilters ?? {}));
    }
  }, [open, editableFields, listFilters]);

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const handleCreate = async () => {
    const validationError = validateRequiredFields(formValues, editableFields);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = {
      ...buildRecordPayload(formValues, editableFields),
      ...listFilters,
    };

    if (!payload.title && typeof payload.organization === 'string') {
      if (configId === 'mous') {
        payload.title = `MoU with ${payload.organization}`;
      } else if (configId === 'resource-person') {
        payload.title = `${formValues.resourceType || 'Resource Person'} at ${payload.organization}`;
      } else if (configId === 'session-chair-reviewer') {
        payload.title = `${formValues.sessionRole || 'Session Chair'} at ${payload.organization}`;
      }
    }

    await createMutation.mutateAsync(payload);
    onOpenChange(false);
    onCreated?.();
  };

  if (editableFields.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add {title} Record</DialogTitle>
          <DialogDescription>
            Fill in the details below to manually add a new record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {editableFields.map((field) => {
            const isLocked = Boolean(listFilters?.[field.key]);

            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`create-${field.key}`}>
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={`create-${field.key}`}
                    value={formValues[field.key] ?? ''}
                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                    rows={4}
                    disabled={isLocked}
                  />
                ) : field.type === 'select' && field.options ? (
                  <Select
                    value={formValues[field.key] ?? ''}
                    onValueChange={(value) => handleFieldChange(field.key, value)}
                    disabled={isLocked}
                  >
                    <SelectTrigger id={`create-${field.key}`}>
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
                    id={`create-${field.key}`}
                    type={
                      field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'
                    }
                    min={field.type === 'number' ? 0 : undefined}
                    value={formValues[field.key] ?? ''}
                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                    disabled={isLocked}
                  />
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <Save className="size-4" />
              Add Record
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AddRecordButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <Plus className="size-4" />
      Add Record
    </Button>
  );
}
