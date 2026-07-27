'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GenerateReportPayload, ReportExportFormat } from '@/types/api-models';
import type { ReportTemplate } from '../types';

interface GenerateReportDialogProps {
  template: ReportTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (payload: GenerateReportPayload) => void;
  isGenerating?: boolean;
}

interface GenerateFormValues {
  format: ReportExportFormat;
  academicYear: string;
  month: string;
  year: string;
  department: string;
  startDate: string;
  endDate: string;
}

export function GenerateReportDialog({
  template,
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
}: GenerateReportDialogProps) {
  const form = useForm<GenerateFormValues>({
    defaultValues: {
      format: 'pdf',
      academicYear: '',
      month: '',
      year: String(new Date().getFullYear()),
      department: '',
      startDate: '',
      endDate: '',
    },
  });

  useEffect(() => {
    if (!template) return;
    form.reset({
      format: 'pdf',
      academicYear: template.defaultFilters?.academicYear ?? '',
      month: template.defaultFilters?.month ?? '',
      year: String(template.defaultFilters?.year ?? new Date().getFullYear()),
      department: '',
      startDate: '',
      endDate: '',
    });
  }, [template, form]);

  const handleSubmit = (values: GenerateFormValues) => {
    if (!template) return;

    onGenerate({
      reportType: template.backendReportType,
      format: values.format,
      academicYear: values.academicYear || undefined,
      month: values.month || undefined,
      year: values.year ? Number(values.year) : undefined,
      department: values.department || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate {template?.title ?? 'Report'}</DialogTitle>
          <DialogDescription>
            Configure filters and export format. AI summary, charts, and document generation start immediately.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={form.watch('format')}
              onValueChange={(value) => form.setValue('format', value as ReportExportFormat)}
            >
              <SelectTrigger id="format" aria-label="Export format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF — Best for preview and sharing</SelectItem>
                <SelectItem value="docx">DOCX — Editable Word document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input id="academicYear" placeholder="2025-2026" {...form.register('academicYear')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" placeholder="Computer Science" {...form.register('department')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input id="month" placeholder="July" {...form.register('month')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" min={2000} max={2100} {...form.register('year')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...form.register('startDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...form.register('endDate')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isGenerating}>
              Generate Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
