import type {
  DashboardMonthlyStatistics,
  DashboardRecentActivity,
  DashboardSummary,
  DashboardYearlyStatistics,
} from '@/types/api-models';

export interface DashboardTotals {
  pendingReviews: number;
  facultyAchievements: number;
  placements: number;
  internships: number;
  publications: number;
  patents: number;
}

export interface DashboardStatItem {
  id: string;
  label: string;
  value: number;
  trend: number | null;
  trendLabel: string;
}

export interface MonthlyTrendPoint {
  month: string;
  placements: number;
  internships: number;
  studentAchievements: number;
  facultyAchievements: number;
  publications: number;
  pendingReviews: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  yearly: DashboardYearlyStatistics;
  currentMonth: DashboardMonthlyStatistics;
  previousMonth: DashboardMonthlyStatistics;
  monthlyTrend: MonthlyTrendPoint[];
  activities: DashboardRecentActivity[];
  stats: DashboardStatItem[];
}

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const computeTrend = (current: number, previous: number): number | null => {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
};

export const buildDashboardStats = (
  summary: DashboardSummary,
  current: DashboardMonthlyStatistics,
  previous: DashboardMonthlyStatistics,
  yearly: DashboardYearlyStatistics,
): DashboardStatItem[] => [
  {
    id: 'pendingReviews',
    label: 'Pending Reviews',
    value: summary.pendingReviews,
    trend: computeTrend(current.pendingReviews, previous.pendingReviews),
    trendLabel: 'vs last month',
  },
  {
    id: 'studentAchievements',
    label: 'Student Achievements',
    value: yearly.studentAchievements,
    trend: computeTrend(current.studentAchievements, previous.studentAchievements),
    trendLabel: 'vs last month',
  },
  {
    id: 'facultyAchievements',
    label: 'Faculty Achievements',
    value: summary.totalFacultyAchievements,
    trend: computeTrend(current.facultyAchievements, previous.facultyAchievements),
    trendLabel: 'vs last month',
  },
  {
    id: 'placements',
    label: 'Placements',
    value: summary.totalPlacements,
    trend: computeTrend(current.placements, previous.placements),
    trendLabel: 'vs last month',
  },
  {
    id: 'internships',
    label: 'Internships',
    value: summary.totalInternships,
    trend: computeTrend(current.internships, previous.internships),
    trendLabel: 'vs last month',
  },
  {
    id: 'publications',
    label: 'Publications',
    value: summary.totalPublications,
    trend: computeTrend(current.publications, previous.publications),
    trendLabel: 'vs last month',
  },
  {
    id: 'patents',
    label: 'Patents',
    value: summary.totalPatents,
    trend: computeTrend(current.patents, previous.patents),
    trendLabel: 'vs last month',
  },
  {
    id: 'eventReports',
    label: 'Completed Event Reports',
    value: yearly.eventReports,
    trend: computeTrend(current.eventReports, previous.eventReports),
    trendLabel: 'vs last month',
  },
];
