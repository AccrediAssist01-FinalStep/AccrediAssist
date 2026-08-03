import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Building2,
  CalendarDays,
  FileBadge,
  GraduationCap,
  MapPinned,
  ScrollText,
  Users,
} from 'lucide-react';
import type { BackendReportType, ReportExportFormat, ReportQueryParams } from '@/types/api-models';

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  backendReportType: BackendReportType;
  accent: string;
  defaultFilters?: {
    academicYear?: string;
    month?: string;
    year?: number;
  };
}

/** Exactly eight ERP report cards */
export const GENERATION_REPORT_TYPES: BackendReportType[] = [
  'Student Activities',
  'Faculty Activities',
  'Department Activities',
  'NBA',
  'NAAC',
  'AICTE',
  'AI Generated Workshop',
  'AI Generated Industrial Visit',
];

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'student-activities',
    title: 'Student Activities Report',
    description:
      'Complete student activity repository with sports, cultural, technical, placements, internships, and events.',
    icon: GraduationCap,
    backendReportType: 'Student Activities',
    accent: 'from-amber-500/20 to-orange-500/5',
    defaultFilters: { academicYear: '2025-2026' },
  },
  {
    id: 'faculty-activities',
    title: 'Faculty Activities Report',
    description:
      'Faculty development, publications, patents, consultancy, awards, and professional milestones.',
    icon: Award,
    backendReportType: 'Faculty Activities',
    accent: 'from-fuchsia-500/20 to-purple-500/5',
    defaultFilters: { academicYear: '2025-2026' },
  },
  {
    id: 'department-activities',
    title: 'Department Activities Report',
    description:
      'Department events, industrial visits, notifications, achievements, and accreditation activities.',
    icon: Users,
    backendReportType: 'Department Activities',
    accent: 'from-rose-500/20 to-pink-500/5',
    defaultFilters: { academicYear: '2025-2026' },
  },
  {
    id: 'nba',
    title: 'NBA Report',
    description: 'National Board of Accreditation compliance summary with institutional metrics.',
    icon: Building2,
    backendReportType: 'NBA',
    accent: 'from-blue-500/20 to-indigo-500/5',
    defaultFilters: { academicYear: '2025-2026' },
  },
  {
    id: 'naac',
    title: 'NAAC Report',
    description: 'NAAC accreditation documentation with quality indicators and outcomes.',
    icon: FileBadge,
    backendReportType: 'NAAC',
    accent: 'from-violet-500/20 to-purple-500/5',
    defaultFilters: { academicYear: '2025-2026' },
  },
  {
    id: 'aicte',
    title: 'AICTE Report',
    description: 'AICTE regulatory report covering programs, faculty, and infrastructure.',
    icon: ScrollText,
    backendReportType: 'AICTE',
    accent: 'from-cyan-500/20 to-sky-500/5',
    defaultFilters: { academicYear: '2025-2026' },
  },
  {
    id: 'ai-workshop',
    title: 'Workshop Report',
    description: 'AI-generated workshop analytics with event details, photos, and executive summary.',
    icon: CalendarDays,
    backendReportType: 'AI Generated Workshop',
    accent: 'from-emerald-500/20 to-green-500/5',
    defaultFilters: { year: new Date().getFullYear() },
  },
  {
    id: 'ai-industrial-visit',
    title: 'Industrial Visit Report',
    description: 'AI-generated industrial visit analytics with participation metrics and summary.',
    icon: MapPinned,
    backendReportType: 'AI Generated Industrial Visit',
    accent: 'from-indigo-500/20 to-blue-500/5',
  },
];

export interface ReportsFilterState {
  search: string;
  reportType: BackendReportType | 'all';
  status: 'all' | 'completed' | 'generating' | 'pending' | 'failed';
  format: ReportExportFormat | 'all';
  fromDate: string;
  toDate: string;
  page: number;
  limit: number;
  sortBy: ReportQueryParams['sortBy'];
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_REPORTS_FILTERS: ReportsFilterState = {
  search: '',
  reportType: 'all',
  status: 'all',
  format: 'all',
  fromDate: '',
  toDate: '',
  page: 1,
  limit: 10,
  sortBy: 'generatedDate',
  sortOrder: 'desc',
};

export type ReportDisplayStatus = 'ready' | 'processing' | 'pending' | 'failed';

export const SECTION_LABELS: Record<string, string> = {
  cover: 'Cover Page',
  'table-of-contents': 'Table of Contents',
  'executive-summary': 'Executive Summary',
  'key-highlights': 'Key Highlights',
  charts: 'Charts & Analytics',
  statistics: 'Statistics',
  tables: 'Data Tables',
  images: 'Event Images',
  recommendations: 'Recommendations',
  appendix: 'Appendix',
};
