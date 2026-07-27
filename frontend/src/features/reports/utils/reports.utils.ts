import type { ReportExportFormat, ReportRecord, ReportStatus } from '@/types/api-models';
import type { ReportDisplayStatus, ReportTemplate } from '../types';
import { GENERATION_REPORT_TYPES } from '../types';

export function isGenerationReportType(reportType: string): boolean {
  return (GENERATION_REPORT_TYPES as readonly string[]).includes(reportType);
}

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

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getReportStatus(record: ReportRecord): ReportDisplayStatus {
  if (record.status === 'failed') return 'failed';
  if (record.status === 'generating') return 'processing';
  if (record.status === 'completed' || record.downloadReady) return 'ready';
  if (record.status === 'pending') return 'pending';

  const ageMs = Date.now() - new Date(record.generatedDate).getTime();
  if (ageMs < 5 * 60_000) return 'processing';
  return 'pending';
}

export function getStatusLabel(status: ReportDisplayStatus): string {
  switch (status) {
    case 'ready':
      return 'Completed';
    case 'processing':
      return 'Generating';
    case 'failed':
      return 'Failed';
    default:
      return 'Pending';
  }
}

export function getStatusBadgeVariant(
  status: ReportDisplayStatus,
): 'success' | 'warning' | 'secondary' | 'destructive' {
  switch (status) {
    case 'ready':
      return 'success';
    case 'processing':
      return 'warning';
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function getReportProgress(record: ReportRecord): number {
  const status = getReportStatus(record);
  if (status === 'ready') return 100;
  if (status === 'failed') return 0;
  if (status === 'processing') return 65;
  return 15;
}

export function getReportQuality(record: ReportRecord): { label: string; score: number } {
  const status = getReportStatus(record);
  if (status === 'ready') {
    const sectionBonus = Math.min((record.sectionsIncluded?.length ?? 0) * 3, 15);
    return { label: 'High Quality', score: Math.min(95 + sectionBonus, 100) };
  }
  if (status === 'processing') return { label: 'In Progress', score: 45 };
  if (status === 'failed') return { label: 'Generation Failed', score: 0 };
  return { label: 'Awaiting Generation', score: 20 };
}

export function getReportFormat(record: ReportRecord): ReportExportFormat | 'unknown' {
  if (record.exportFormat) return record.exportFormat;
  if (record.fileName?.endsWith('.docx')) return 'docx';
  if (record.fileName?.endsWith('.pdf')) return 'pdf';
  if (record.fileUrl && /\.docx(?:\?|$)/i.test(record.fileUrl)) return 'docx';
  if (record.fileUrl && /\.pdf(?:\?|$)/i.test(record.fileUrl)) return 'pdf';
  if (record.downloadUrl && /\.docx(?:\?|$)/i.test(record.downloadUrl)) return 'docx';
  return record.downloadReady ? 'pdf' : 'unknown';
}

export function buildReportSummary(record: ReportRecord): string {
  const filters = record.filtersApplied ?? {};
  const parts: string[] = [`${record.reportType} institutional report`];

  if (filters.academicYear) parts.push(`Academic Year ${filters.academicYear}`);
  if (filters.department) parts.push(`Department: ${filters.department}`);
  if (filters.month && filters.year) parts.push(`${filters.month} ${filters.year}`);
  else if (filters.year) parts.push(String(filters.year));

  const status = getReportStatus(record);
  if (status === 'ready') {
    parts.push('Document is ready for preview and download.');
  } else if (status === 'processing') {
    parts.push('AI pipeline is generating charts, summary, and formatted document.');
  } else if (status === 'failed') {
    parts.push(record.errorMessage ?? 'Generation failed. Try again with different filters.');
  } else {
    parts.push('Report request recorded. Add a format to generate PDF or DOCX.');
  }

  return parts.join(' · ');
}

export function getLatestReportForTemplate(
  template: ReportTemplate,
  reports: ReportRecord[],
): ReportRecord | undefined {
  return reports
    .filter((report) => report.reportType === template.backendReportType)
    .sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime())[0];
}

export function mapStatusFilterToBackend(
  status: 'all' | 'completed' | 'generating' | 'pending' | 'failed',
): ReportStatus | undefined {
  if (status === 'all') return undefined;
  return status;
}

export async function downloadReportBlob(blob: Blob, fileName: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

export function buildPreviewFileName(record: ReportRecord, format?: ReportExportFormat): string {
  if (record.fileName) return record.fileName;
  const ext = format ?? getReportFormat(record);
  const safeTitle = record.reportTitle
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 120);
  return `${safeTitle || 'report'}.${ext === 'docx' ? 'docx' : 'pdf'}`;
}
