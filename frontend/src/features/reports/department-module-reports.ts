import { Award, Bell, Building2, CalendarCheck, ShieldCheck, Trophy } from 'lucide-react';
import type { ReportTemplate } from './types';

const accent = 'from-emerald-500/20 to-teal-500/5';
const year = { academicYear: '2025-2026' } as const;

export const DEPARTMENT_MODULE_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'department-module-events',
    title: 'Department Events Report',
    description: 'Department events only.',
    icon: CalendarCheck,
    backendReportType: 'Department Activities',
    departmentModule: 'department-events',
    accent,
    defaultFilters: year,
  },
  {
    id: 'department-module-industrial-visits',
    title: 'Department Industrial Visits Report',
    description: 'Industrial visit reports only.',
    icon: Building2,
    backendReportType: 'Department Activities',
    departmentModule: 'industrial-visits',
    accent,
    defaultFilters: year,
  },
  {
    id: 'department-module-notifications',
    title: 'Department Notifications Report',
    description: 'Department notifications only.',
    icon: Bell,
    backendReportType: 'Department Activities',
    departmentModule: 'department-notifications',
    accent,
    defaultFilters: year,
  },
  {
    id: 'department-module-repository',
    title: 'Department Achievement Repository Report',
    description: 'Approved student achievement records in the department repository.',
    icon: Trophy,
    backendReportType: 'Department Activities',
    departmentModule: 'achievement-repository',
    accent,
    defaultFilters: year,
  },
  {
    id: 'department-module-accreditation',
    title: 'Department Accreditation Activities Report',
    description: 'Accreditation-related faculty records only.',
    icon: ShieldCheck,
    backendReportType: 'Department Activities',
    departmentModule: 'accreditation-activities',
    accent,
    defaultFilters: year,
  },
  {
    id: 'department-module-achievements',
    title: 'Department Achievements Report',
    description: 'Department-level achievements only.',
    icon: Award,
    backendReportType: 'Department Activities',
    departmentModule: 'department-achievements',
    accent,
    defaultFilters: year,
  },
];
