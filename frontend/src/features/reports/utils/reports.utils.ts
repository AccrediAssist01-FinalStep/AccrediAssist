import type { ReportRecord } from '@/types/api-models';
import type { ReportDisplayStatus, ReportTemplate } from '../types';

export function formatReportDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatShortReportDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function getReportStatus(record: ReportRecord): ReportDisplayStatus {
  if (record.downloadReady) return 'ready';
  const ageMs = Date.now() - new Date(record.generatedDate).getTime();
  if (ageMs < 5 * 60_000) return 'processing';
  return 'pending';
}

export function getStatusLabel(status: ReportDisplayStatus): string {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'processing':
      return 'Generating';
    default:
      return 'Pending';
  }
}

export function getStatusBadgeVariant(
  status: ReportDisplayStatus,
): 'success' | 'warning' | 'secondary' {
  switch (status) {
    case 'ready':
      return 'success';
    case 'processing':
      return 'warning';
    default:
      return 'secondary';
  }
}

export function getReportQuality(record: ReportRecord): { label: string; score: number } {
  if (record.downloadReady) return { label: 'High Quality', score: 95 };
  const status = getReportStatus(record);
  if (status === 'processing') return { label: 'In Progress', score: 45 };
  return { label: 'Awaiting Generation', score: 20 };
}

export function getFileFormat(fileUrl?: string): 'pdf' | 'docx' | 'unknown' {
  if (!fileUrl) return 'unknown';
  if (/\.docx(?:\?|$)/i.test(fileUrl)) return 'docx';
  if (/\.pdf(?:\?|$)/i.test(fileUrl)) return 'pdf';
  return 'pdf';
}

export function buildReportSummary(record: ReportRecord): string {
  const filters = record.filtersApplied ?? {};
  const parts: string[] = [`${record.reportType} report`];

  if (filters.academicYear) parts.push(`Academic Year ${filters.academicYear}`);
  if (filters.department) parts.push(`Department: ${filters.department}`);
  if (filters.month && filters.year) parts.push(`${filters.month} ${filters.year}`);
  else if (filters.year) parts.push(String(filters.year));

  if (record.downloadReady) {
    parts.push('Document is ready for download.');
  } else {
    parts.push('AI generation is queued. The document will be available once processing completes.');
  }

  return parts.join(' · ');
}

export function getLatestReportForTemplate(
  template: ReportTemplate,
  reports: ReportRecord[],
): ReportRecord | undefined {
  return reports.find((report) => {
    if (report.reportType !== template.backendReportType) return false;
    if (template.id === 'publication' || template.id === 'patent') {
      return report.reportTitle.toLowerCase().includes(template.id);
    }
    if (['nba', 'naac', 'aicte'].includes(template.id)) {
      return report.reportTitle.toLowerCase().includes(template.title.split(' ')[0].toLowerCase())
        || report.filtersApplied?.academicYear != null;
    }
    return true;
  });
}

export function filterReportsByStatus(
  reports: ReportRecord[],
  status: 'all' | 'ready' | 'pending',
): ReportRecord[] {
  if (status === 'all') return reports;
  if (status === 'ready') return reports.filter((report) => report.downloadReady);
  return reports.filter((report) => !report.downloadReady);
}

export async function triggerFileDownload(url: string, fileName: string): Promise<void> {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getFilterEntries(record: ReportRecord): Array<{ label: string; value: string }> {
  const filters = record.filtersApplied ?? {};
  return Object.entries(filters)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase()),
      value: typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value),
    }));
}
