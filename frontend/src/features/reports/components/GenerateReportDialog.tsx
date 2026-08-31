'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import type { BackendReportType, GenerateReportPayload, ReportExportFormat } from '@/types/api-models';
import type { ReportTemplate } from '../types';
import {
  formatEventReportOptionLabel,
  useEventReportsForReport,
} from '../hooks/use-event-reports-for-report';

interface GenerateReportDialogProps {
  template: ReportTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (payload: GenerateReportPayload) => void;
  isGenerating?: boolean;
}

interface GenerateFormValues {
  format: ReportExportFormat;
  eventReportId: string;
  academicYear: string;
  month: string;
  year: string;
  department: string;
  semester: string;
  category: string;
  faculty: string;
  student: string;
  keyword: string;
  startDate: string;
  endDate: string;
}

const isEventReportGeneration = (reportType?: BackendReportType): boolean =>
  reportType === 'AI Generated Workshop' || reportType === 'AI Generated Industrial Visit';

export function GenerateReportDialog({
  template,
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
}: GenerateReportDialogProps) {
  const isEventReport = isEventReportGeneration(template?.backendReportType);
  const eventReportsQuery = useEventReportsForReport(
    template?.backendReportType ?? null,
    open && isEventReport,
  );

  const form = useForm<GenerateFormValues>({
    defaultValues: {
      format: 'pdf',
      eventReportId: '',
      academicYear: '',
      month: '',
      year: String(new Date().getFullYear()),
      department: '',
      semester: '',
      category: '',
      faculty: '',
      student: '',
      keyword: '',
      startDate: '',
      endDate: '',
    },
  });

  useEffect(() => {
    if (!template) return;
    form.reset({
      format: 'pdf',
      eventReportId: '',
      academicYear: template.defaultFilters?.academicYear ?? '',
      month: template.defaultFilters?.month ?? '',
      year: String(template.defaultFilters?.year ?? new Date().getFullYear()),
      department: '',
      semester: '',
      category: '',
      faculty: '',
      student: '',
      keyword: '',
      startDate: '',
      endDate: '',
    });
  }, [template, form]);

  const handleSubmit = (values: GenerateFormValues) => {
    if (!template) return;

    if (isEventReport) {
      if (!values.eventReportId) {
        toast.error(
          template.backendReportType === 'AI Generated Workshop'
            ? 'Please select a workshop'
            : 'Please select an industrial visit',
        );
        return;
      }

      const selectedEvent = eventReportsQuery.data?.find((event) => event._id === values.eventReportId);

      onGenerate({
        reportType: template.backendReportType,
        format: values.format,
        eventReportId: values.eventReportId,
        eventTitle: selectedEvent?.eventTitle,
      });
      return;
    }

    onGenerate({
      reportType: template.backendReportType,
      format: values.format,
      academicYear: values.academicYear || undefined,
      month: values.month || undefined,
      year: values.year ? Number(values.year) : undefined,
      department: values.department || undefined,
      semester: values.semester ? Number(values.semester) : undefined,
      category: values.category || undefined,
      faculty: values.faculty || undefined,
      student: values.student || undefined,
      keyword: values.keyword || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      studentModule: template.studentModule,
      facultyModule: template.facultyModule,
      departmentModule: template.departmentModule,
    });
  };

  const eventOptions = eventReportsQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate {template?.title ?? 'Report'}</DialogTitle>
          <DialogDescription>
            {isEventReport ? (
              <>
                Select the {template?.backendReportType === 'AI Generated Workshop' ? 'workshop' : 'industrial visit'}{' '}
                by name and choose an export format. The existing report template is used as-is.
              </>
            ) : (
              <>
                Configure filters and export format. AI summary, charts, and document generation start immediately.
                {template?.backendReportType === 'Student Activities' && !template?.studentModule && (
                  <span className="mt-2 block text-xs">
                    Includes a date-wise tabular register of all sub-modules (Sports, Cultural, Technical, Placements,
                    Workshops, etc.). Use Start/End Date or Academic Year to filter the date range.
                  </span>
                )}
                {(template?.studentModule || template?.facultyModule || template?.departmentModule) && (
                  <span className="mt-2 block text-xs">
                    Generates a module-wise report for {template.title.replace(/ Report$/, '')} only. Existing year,
                    department, and name filters still apply.
                  </span>
                )}
              </>
            )}
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

          {isEventReport ? (
            <div className="space-y-2">
              <Label htmlFor="eventReportId">
                {template?.backendReportType === 'AI Generated Workshop'
                  ? 'Workshop Name'
                  : 'Industrial Visit Name'}
                <span className="text-destructive"> *</span>
              </Label>
              <Select
                value={form.watch('eventReportId')}
                onValueChange={(value) => form.setValue('eventReportId', value)}
                disabled={eventReportsQuery.isLoading}
              >
                <SelectTrigger id="eventReportId">
                  <SelectValue
                    placeholder={
                      eventReportsQuery.isLoading
                        ? 'Loading events...'
                        : `Select a ${template?.backendReportType === 'AI Generated Workshop' ? 'workshop' : 'industrial visit'}`
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {eventOptions.map((event) => (
                    <SelectItem key={event._id} value={event._id}>
                      {formatEventReportOptionLabel(event)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {eventReportsQuery.isError ? (
                <p className="text-xs text-destructive">Unable to load events. Please try again.</p>
              ) : null}
              {!eventReportsQuery.isLoading && eventOptions.length === 0 ? (
                <p className="text-xs text-muted">
                  Add or approve a {template?.backendReportType === 'AI Generated Workshop' ? 'workshop' : 'industrial visit'}{' '}
                  record first, then return here to generate its report.
                </p>
              ) : null}
            </div>
          ) : (
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
                <Label htmlFor="semester">Semester</Label>
                <Input id="semester" type="number" min={1} max={2} placeholder="1 or 2" {...form.register('semester')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="Sports, Workshop, etc." {...form.register('category')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty</Label>
                <Input id="faculty" placeholder="Faculty name" {...form.register('faculty')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Input id="student" placeholder="Student name" {...form.register('student')} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="keyword">Keyword Search</Label>
                <Input id="keyword" placeholder="Search across all report sections" {...form.register('keyword')} />
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
          )}

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
