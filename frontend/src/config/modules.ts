import {
  Award,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/types/auth';
import type { FeatureColumn } from '@/features/feature-records/types';

export type ErpModuleId = 'student' | 'faculty' | 'department';

export type SubmoduleViewType = 'records' | 'notifications' | 'repository' | 'accreditation';

export interface SubmoduleConfig {
  id: string;
  label: string;
  slug: string;
  moduleId: ErpModuleId;
  route: string;
  apiPath?: string;
  listFilters?: Record<string, string>;
  columns?: FeatureColumn[];
  searchPlaceholder?: string;
  viewType: SubmoduleViewType;
  icon: LucideIcon;
  description: string;
}

export interface ErpModuleConfig {
  id: ErpModuleId;
  label: string;
  icon: LucideIcon;
  gradient: string;
  description: string;
  submodules: SubmoduleConfig[];
}

const studentColumns = {
  achievement: [
    { key: 'studentName', label: 'Student' },
    { key: 'achievementType', label: 'Type' },
    { key: 'title', label: 'Title' },
    { key: 'organization', label: 'Organization' },
    { key: 'date', label: 'Date', format: 'date' as const },
  ],
  placement: [
    { key: 'studentName', label: 'Student' },
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    { key: 'package', label: 'Package' },
    { key: 'joiningDate', label: 'Joining Date', format: 'date' as const },
  ],
  internship: [
    { key: 'studentName', label: 'Student' },
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    { key: 'duration', label: 'Duration' },
    { key: 'startDate', label: 'Start Date', format: 'date' as const },
  ],
  event: [
    { key: 'eventTitle', label: 'Event' },
    { key: 'eventType', label: 'Type' },
    { key: 'coordinator', label: 'Coordinator' },
    { key: 'venue', label: 'Venue' },
    { key: 'date', label: 'Date', format: 'date' as const },
  ],
};

const facultyColumns = {
  achievement: [
    { key: 'facultyName', label: 'Faculty' },
    { key: 'achievementType', label: 'Type' },
    { key: 'title', label: 'Title' },
    { key: 'organization', label: 'Organization' },
    { key: 'date', label: 'Date', format: 'date' as const },
  ],
  publication: [
    { key: 'facultyName', label: 'Faculty' },
    { key: 'paperTitle', label: 'Paper Title' },
    { key: 'journal', label: 'Journal' },
    { key: 'conference', label: 'Conference' },
    { key: 'publicationDate', label: 'Date', format: 'date' as const },
  ],
  patent: [
    { key: 'patentTitle', label: 'Title' },
    { key: 'inventors', label: 'Inventors', format: 'list' as const },
    { key: 'patentNumber', label: 'Patent No.' },
    { key: 'status', label: 'Status' },
    { key: 'filingDate', label: 'Filing Date', format: 'date' as const },
  ],
  event: studentColumns.event,
};

const studentSubmodule = (
  id: string,
  label: string,
  slug: string,
  icon: LucideIcon,
  config: Omit<SubmoduleConfig, 'id' | 'label' | 'slug' | 'moduleId' | 'route' | 'icon'>,
): SubmoduleConfig => ({
  id,
  label,
  slug,
  moduleId: 'student',
  route: `/student-activities/${slug}`,
  icon,
  ...config,
});

const facultySubmodule = (
  id: string,
  label: string,
  slug: string,
  icon: LucideIcon,
  config: Omit<SubmoduleConfig, 'id' | 'label' | 'slug' | 'moduleId' | 'route' | 'icon'>,
): SubmoduleConfig => ({
  id,
  label,
  slug,
  moduleId: 'faculty',
  route: `/faculty-activities/${slug}`,
  icon,
  ...config,
});

const departmentSubmodule = (
  id: string,
  label: string,
  slug: string,
  icon: LucideIcon,
  config: Omit<SubmoduleConfig, 'id' | 'label' | 'slug' | 'moduleId' | 'route' | 'icon'>,
): SubmoduleConfig => ({
  id,
  label,
  slug,
  moduleId: 'department',
  route: `/department-activities/${slug}`,
  icon,
  ...config,
});

export const ERP_MODULES: ErpModuleConfig[] = [
  {
    id: 'student',
    label: 'Student Activities',
    icon: GraduationCap,
    gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    description: 'Sports, placements, internships, certifications and student-led events.',
    submodules: [
      studentSubmodule('sports', 'Sports', 'sports', Trophy, {
        apiPath: '/student-achievements',
        listFilters: { achievementType: 'Sports' },
        columns: studentColumns.achievement,
        searchPlaceholder: 'Search sports achievements...',
        viewType: 'records',
        description: 'Student sports achievements and competitions.',
      }),
      studentSubmodule('cultural', 'Cultural', 'cultural', Sparkles, {
        apiPath: '/student-achievements',
        listFilters: { achievementType: 'Cultural' },
        columns: studentColumns.achievement,
        searchPlaceholder: 'Search cultural activities...',
        viewType: 'records',
        description: 'Cultural events and student participation records.',
      }),
      studentSubmodule('technical', 'Technical', 'technical', Lightbulb, {
        apiPath: '/student-achievements',
        listFilters: { achievementType: 'Technical' },
        columns: studentColumns.achievement,
        searchPlaceholder: 'Search technical achievements...',
        viewType: 'records',
        description: 'Technical competitions, projects and hackathons.',
      }),
      studentSubmodule('research', 'Research', 'research', Search, {
        apiPath: '/student-achievements',
        listFilters: { achievementType: 'Research' },
        columns: studentColumns.achievement,
        searchPlaceholder: 'Search student research records...',
        viewType: 'records',
        description: 'Student research papers, projects and publications.',
      }),
      studentSubmodule('internship', 'Internship', 'internship', Building2, {
        apiPath: '/internships',
        columns: studentColumns.internship,
        searchPlaceholder: 'Search internships by student or company...',
        viewType: 'records',
        description: 'Approved internship records.',
      }),
      studentSubmodule('placement', 'Placement', 'placement', Briefcase, {
        apiPath: '/placements',
        columns: studentColumns.placement,
        searchPlaceholder: 'Search placements by student or company...',
        viewType: 'records',
        description: 'Approved placement offers and joining details.',
      }),
      studentSubmodule('certifications', 'Certifications', 'certifications', Award, {
        apiPath: '/student-achievements',
        listFilters: { achievementType: 'Certification' },
        columns: studentColumns.achievement,
        searchPlaceholder: 'Search certifications...',
        viewType: 'records',
        description: 'Professional and technical certifications earned by students.',
      }),
      studentSubmodule('workshops', 'Workshops', 'workshops', CalendarCheck, {
        apiPath: '/event-reports',
        listFilters: { eventType: 'Workshop' },
        columns: studentColumns.event,
        searchPlaceholder: 'Search workshop records...',
        viewType: 'records',
        description: 'Workshops attended or organized for students.',
      }),
      studentSubmodule('seminars', 'Seminars', 'seminars', Users, {
        apiPath: '/event-reports',
        listFilters: { eventType: 'Seminar' },
        columns: studentColumns.event,
        searchPlaceholder: 'Search seminar records...',
        viewType: 'records',
        description: 'Seminar participation and completion records.',
      }),
      studentSubmodule('industrial-visits', 'Industrial Visits', 'industrial-visits', Building2, {
        apiPath: '/event-reports',
        listFilters: { eventType: 'Industrial Visit' },
        columns: studentColumns.event,
        searchPlaceholder: 'Search industrial visit records...',
        viewType: 'records',
        description: 'Industrial visit reports with photos and summaries.',
      }),
      studentSubmodule('startup-innovation', 'Startup & Innovation', 'startup-innovation', Sparkles, {
        apiPath: '/student-achievements',
        listFilters: { achievementType: 'Hackathon' },
        columns: studentColumns.achievement,
        searchPlaceholder: 'Search startup and innovation records...',
        viewType: 'records',
        description: 'Startup initiatives, innovation challenges and hackathons.',
      }),
      studentSubmodule('nss-ncc', 'NSS / NCC', 'nss-ncc', Users, {
        apiPath: '/student-achievements',
        listFilters: { achievementType: 'Cultural' },
        columns: studentColumns.achievement,
        searchPlaceholder: 'Search NSS/NCC activities...',
        viewType: 'records',
        description: 'NSS and NCC social service and leadership activities.',
      }),
    ],
  },
  {
    id: 'faculty',
    label: 'Faculty Activities',
    icon: Users,
    gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
    description: 'FDPs, publications, patents, conferences and faculty professional development.',
    submodules: [
      facultySubmodule('fdps', 'FDPs', 'fdps', CalendarCheck, {
        apiPath: '/event-reports',
        listFilters: { eventType: 'FDP' },
        columns: facultyColumns.event,
        searchPlaceholder: 'Search FDP records...',
        viewType: 'records',
        description: 'Faculty Development Program participation.',
      }),
      facultySubmodule('workshops-attended', 'Workshops Attended', 'workshops-attended', CalendarCheck, {
        apiPath: '/event-reports',
        listFilters: { eventType: 'Workshop' },
        columns: facultyColumns.event,
        searchPlaceholder: 'Search workshops attended...',
        viewType: 'records',
        description: 'Workshops attended by faculty members.',
      }),
      facultySubmodule('seminars-attended', 'Seminars Attended', 'seminars-attended', Users, {
        apiPath: '/event-reports',
        listFilters: { eventType: 'Seminar' },
        columns: facultyColumns.event,
        searchPlaceholder: 'Search seminars attended...',
        viewType: 'records',
        description: 'Seminars attended by faculty members.',
      }),
      facultySubmodule('conferences', 'Conferences', 'conferences', Landmark, {
        apiPath: '/faculty-achievements',
        listFilters: { achievementType: 'Research' },
        columns: facultyColumns.achievement,
        searchPlaceholder: 'Search conference participation...',
        viewType: 'records',
        description: 'Conference papers and faculty conference participation.',
      }),
      facultySubmodule('publications', 'Publications', 'publications', BookOpen, {
        apiPath: '/publications',
        columns: facultyColumns.publication,
        searchPlaceholder: 'Search publications...',
        viewType: 'records',
        description: 'Journal and conference publications by faculty.',
      }),
      facultySubmodule('patents', 'Patents', 'patents', Lightbulb, {
        apiPath: '/patents',
        columns: facultyColumns.patent,
        searchPlaceholder: 'Search patents...',
        viewType: 'records',
        description: 'Patents filed, published or granted.',
      }),
      facultySubmodule('book-chapters', 'Book Chapters', 'book-chapters', BookOpen, {
        apiPath: '/publications',
        columns: facultyColumns.publication,
        searchPlaceholder: 'Search book chapters...',
        viewType: 'records',
        description: 'Book chapters and edited volumes.',
      }),
      facultySubmodule('consultancy', 'Consultancy', 'consultancy', Briefcase, {
        apiPath: '/faculty-achievements',
        listFilters: { achievementType: 'Award' },
        columns: facultyColumns.achievement,
        searchPlaceholder: 'Search consultancy projects...',
        viewType: 'records',
        description: 'Consultancy and industry engagement records.',
      }),
      facultySubmodule('sponsored-projects', 'Sponsored Projects', 'sponsored-projects', Landmark, {
        apiPath: '/faculty-achievements',
        listFilters: { achievementType: 'Research' },
        columns: facultyColumns.achievement,
        searchPlaceholder: 'Search sponsored projects...',
        viewType: 'records',
        description: 'Funded and sponsored research projects.',
      }),
      facultySubmodule('certifications', 'Certifications', 'certifications', Award, {
        apiPath: '/faculty-achievements',
        listFilters: { achievementType: 'Certification' },
        columns: facultyColumns.achievement,
        searchPlaceholder: 'Search faculty certifications...',
        viewType: 'records',
        description: 'Professional certifications earned by faculty.',
      }),
      facultySubmodule('awards', 'Awards', 'awards', Trophy, {
        apiPath: '/faculty-achievements',
        listFilters: { achievementType: 'Award' },
        columns: facultyColumns.achievement,
        searchPlaceholder: 'Search faculty awards...',
        viewType: 'records',
        description: 'Awards and recognitions received by faculty.',
      }),
      facultySubmodule('guest-lectures', 'Guest Lectures', 'guest-lectures', Users, {
        apiPath: '/event-reports',
        listFilters: { eventType: 'Guest Lecture' },
        columns: facultyColumns.event,
        searchPlaceholder: 'Search guest lecture records...',
        viewType: 'records',
        description: 'Guest lectures delivered or organized.',
      }),
    ],
  },
  {
    id: 'department',
    label: 'Department Activities',
    icon: Building2,
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    description: 'Events, industrial visits, notifications, accreditation and department achievements.',
    submodules: [
      departmentSubmodule('events', 'Events', 'events', CalendarCheck, {
        apiPath: '/event-reports',
        columns: facultyColumns.event,
        searchPlaceholder: 'Search department events...',
        viewType: 'records',
        description: 'Department event scheduling and completed event reports.',
      }),
      departmentSubmodule('industrial-visit-reports', 'Industrial Visit Reports', 'industrial-visit-reports', Building2, {
        apiPath: '/event-reports',
        listFilters: { eventType: 'Industrial Visit' },
        columns: facultyColumns.event,
        searchPlaceholder: 'Search industrial visit reports...',
        viewType: 'records',
        description: 'Industrial visit reports with images and AI summaries.',
      }),
      departmentSubmodule('notifications', 'Notifications', 'notifications', Bell, {
        viewType: 'notifications',
        description: 'Important department notifications and reminders.',
      }),
      departmentSubmodule('achievement-repository', 'Achievement Repository', 'achievement-repository', Trophy, {
        viewType: 'repository',
        description: 'Combined repository of approved student and faculty achievements.',
      }),
      departmentSubmodule('accreditation-mapping', 'Accreditation Mapping', 'accreditation-mapping', ShieldCheck, {
        viewType: 'accreditation',
        description: 'NBA, NAAC and AICTE criteria mapping for accreditation readiness.',
      }),
      departmentSubmodule('department-achievements', 'Department Achievements', 'department-achievements', Award, {
        apiPath: '/faculty-achievements',
        columns: facultyColumns.achievement,
        searchPlaceholder: 'Search department achievements...',
        viewType: 'records',
        description: 'Department-level achievements and milestones.',
      }),
    ],
  },
];

export const ALL_SUBMODULES = ERP_MODULES.flatMap((module) => module.submodules);

export const SUBMODULE_BY_SLUG = Object.fromEntries(
  ALL_SUBMODULES.map((submodule) => [`${submodule.moduleId}/${submodule.slug}`, submodule]),
) as Record<string, SubmoduleConfig>;

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission | null;
}

export interface NavGroup {
  id: ErpModuleId | 'system';
  label: string;
  icon: LucideIcon;
  permission?: Permission | null;
  items: NavItem[];
  defaultOpen?: boolean;
}

export const TOP_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  {
    label: 'Pending Reviews',
    href: '/pending-reviews',
    icon: ClipboardList,
    permission: 'pending_records_view',
  },
];

export const MODULE_NAV_GROUPS: NavGroup[] = ERP_MODULES.map((module) => ({
  id: module.id,
  label: module.label,
  icon: module.icon,
  permission: 'search',
  defaultOpen: module.id === 'student',
  items: module.submodules.map((sub) => ({
    label: sub.label,
    href: sub.route,
    icon: sub.icon,
    permission: 'search' as Permission,
  })),
}));

export const SYSTEM_NAV_ITEMS: NavItem[] = [
  { label: 'Smart Search', href: '/search', icon: Search, permission: 'search' },
  { label: 'Reports', href: '/reports', icon: FileText, permission: 'reports' },
  { label: 'Analytics', href: '/analytics', icon: Landmark, permission: 'dashboard' },
];

export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { label: 'Profile', href: '/profile', icon: User, permission: null },
  { label: 'Settings', href: '/settings', icon: Settings, permission: null },
];

export const LOGOUT_NAV_ITEM: NavItem = {
  label: 'Logout',
  href: '/logout',
  icon: LogOut,
  permission: null,
};

export const PROTECTED_ROUTES = [
  '/dashboard',
  '/pending-reviews',
  '/student-activities',
  '/faculty-activities',
  '/department-activities',
  '/placements',
  '/internships',
  '/student-achievements',
  '/faculty-achievements',
  '/publications',
  '/patents',
  '/event-reports',
  '/search',
  '/reports',
  '/analytics',
  '/notifications',
  '/profile',
  '/settings',
];

export const getSubmodule = (moduleId: string, slug: string): SubmoduleConfig | undefined =>
  SUBMODULE_BY_SLUG[`${moduleId}/${slug}`];

export const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
  '/placements': '/student-activities/placement',
  '/internships': '/student-activities/internship',
  '/student-achievements': '/student-activities/technical',
  '/faculty-achievements': '/faculty-activities/awards',
  '/publications': '/faculty-activities/publications',
  '/patents': '/faculty-activities/patents',
  '/event-reports': '/department-activities/events',
};
