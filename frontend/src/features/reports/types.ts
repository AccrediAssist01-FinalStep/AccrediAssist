import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  FileBadge,
  GraduationCap,
  Lightbulb,
  Newspaper,
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

export const GENERATION_REPORT_TYPES: BackendReportType[] = [
  'NBA',
  'NAAC',
  'AICTE',
  'Placement',
  'Internship',
  'Student Achievement',
  'Faculty Achievement',
  'Publication',
  'Patent',
  'Completed Event',
  'News',
];

export const REPORT_TEMPLATES: ReportTemplate[] = [
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
    id: 'placement',
    title: 'Placement Report',
    description: 'Company-wise placement statistics, packages, and student outcomes.',
    icon: Briefcase,
    backendReportType: 'Placement',
    accent: 'from-emerald-500/20 to-green-500/5',
  },
  {
    id: 'internship',
    title: 'Internship Report',
    description: 'Internship completion analytics across departments and organizations.',
    icon: GraduationCap,
    backendReportType: 'Internship',
    accent: 'from-indigo-500/20 to-blue-500/5',
  },
  {
    id: 'faculty-achievement',
    title: 'Faculty Achievement Report',
    description: 'Faculty awards, certifications, research contributions, and milestones.',
    icon: Award,
    backendReportType: 'Faculty Achievement',
    accent: 'from-fuchsia-500/20 to-purple-500/5',
  },
  {
    id: 'student-achievement',
    title: 'Student Achievement Report',
    description: 'Student competitions, sports, technical events, and cultural achievements.',
    icon: Users,
    backendReportType: 'Student Achievement',
    accent: 'from-amber-500/20 to-orange-500/5',
  },
  {
    id: 'publication',
    title: 'Publication Report',
    description: 'Faculty publication summary including journals, conferences, and citations.',
    icon: BookOpen,
    backendReportType: 'Publication',
    accent: 'from-sky-500/20 to-blue-500/5',
  },
  {
    id: 'patent',
    title: 'Patent Report',
    description: 'Patent filings, grants, and intellectual property portfolio overview.',
    icon: Lightbulb,
    backendReportType: 'Patent',
    accent: 'from-teal-500/20 to-emerald-500/5',
  },
  {
    id: 'completed-event',
    title: 'Completed Event Report',
    description: 'Workshops, seminars, industrial visits, and training program summaries.',
    icon: CalendarDays,
    backendReportType: 'Completed Event',
    accent: 'from-rose-500/20 to-pink-500/5',
  },
  {
    id: 'news',
    title: 'News Analytics Report',
    description: 'Total news, department-wise coverage, monthly trends, and AI news summary.',
    icon: Newspaper,
    backendReportType: 'News',
    accent: 'from-orange-500/20 to-amber-500/5',
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
