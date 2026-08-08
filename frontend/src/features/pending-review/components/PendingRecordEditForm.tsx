'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import type { PendingRecord } from '@/types/api-models';
import { RECORD_CATEGORIES } from '../types';
import { resolveFacultyName, resolveStudentName } from '../utils/extracted-person-fields.util';

const editFormSchema = z.object({
  category: z.string().min(1),
  confidenceScore: z.coerce.number().min(0).max(100),
  title: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  studentName: z.string().max(100).optional(),
  facultyName: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  organization: z.string().max(200).optional(),
  eventName: z.string().max(300).optional(),
  publicationTitle: z.string().max(500).optional(),
  patentTitle: z.string().max(500).optional(),
  internship: z.string().max(200).optional(),
  placement: z.string().max(200).optional(),
  date: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
});

type EditFormValues = z.infer<typeof editFormSchema>;

interface PendingRecordEditFormProps {
  record: PendingRecord;
  onSave: (values: EditFormValues) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function PendingRecordEditForm({ record, onSave, onCancel, isSaving }: PendingRecordEditFormProps) {
  const data = record.extractedData ?? {};

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      category: record.category,
      confidenceScore: record.confidenceScore,
      title: data.title ?? '',
      description: data.description ?? '',
      studentName: resolveStudentName(data),
      facultyName: resolveFacultyName(data),
      company: data.company ?? '',
      organization: data.organization ?? '',
      eventName: data.eventName ?? '',
      publicationTitle: data.publicationTitle ?? '',
      patentTitle: data.patentTitle ?? '',
      internship: data.internship ?? '',
      placement: data.placement ?? '',
      date: data.date ?? '',
      location: data.location ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      category: record.category,
      confidenceScore: record.confidenceScore,
      title: data.title ?? '',
      description: data.description ?? '',
      studentName: resolveStudentName(data),
      facultyName: resolveFacultyName(data),
      company: data.company ?? '',
      organization: data.organization ?? '',
      eventName: data.eventName ?? '',
      publicationTitle: data.publicationTitle ?? '',
      patentTitle: data.patentTitle ?? '',
      internship: data.internship ?? '',
      placement: data.placement ?? '',
      date: data.date ?? '',
      location: data.location ?? '',
    });
  }, [record, form, data]);

  const fields: Array<{ name: keyof EditFormValues; label: string; multiline?: boolean }> = [
    { name: 'title', label: 'Title' },
    { name: 'description', label: 'Description', multiline: true },
    { name: 'studentName', label: 'Student Name' },
    { name: 'facultyName', label: 'Faculty Name' },
    { name: 'company', label: 'Company' },
    { name: 'organization', label: 'Organization' },
    { name: 'eventName', label: 'Event Name' },
    { name: 'publicationTitle', label: 'Publication Title' },
    { name: 'patentTitle', label: 'Patent Title' },
    { name: 'internship', label: 'Internship' },
    { name: 'placement', label: 'Placement' },
    { name: 'date', label: 'Date' },
    { name: 'location', label: 'Location' },
  ];

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(onSave)}
      aria-label="Edit extracted record fields"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={form.watch('category')}
            onValueChange={(value) => form.setValue('category', value)}
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECORD_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confidenceScore">AI Confidence Score</Label>
          <Input id="confidenceScore" type="number" min={0} max={100} {...form.register('confidenceScore')} />
          {form.formState.errors.confidenceScore && (
            <p className="text-xs text-danger">{form.formState.errors.confidenceScore.message}</p>
          )}
        </div>
      </div>

      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          {field.multiline ? (
            <Textarea id={field.name} rows={3} {...form.register(field.name)} />
          ) : (
            <Input id={field.name} {...form.register(field.name)} />
          )}
          {form.formState.errors[field.name] && (
            <p className="text-xs text-danger">{String(form.formState.errors[field.name]?.message)}</p>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" isLoading={isSaving}>
          Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel Changes
        </Button>
      </div>
    </form>
  );
}

export type { EditFormValues };
