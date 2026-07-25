export interface DashboardTotalResponse {
  total: number;
}

export interface DashboardMonthlyStatistics {
  year: number;
  month: number;
  placements: number;
  internships: number;
  studentAchievements: number;
  facultyAchievements: number;
  publications: number;
  patents: number;
  pendingReviews: number;
  eventReports: number;
}

export interface DashboardYearlyStatistics {
  year: number;
  placements: number;
  internships: number;
  studentAchievements: number;
  facultyAchievements: number;
  publications: number;
  patents: number;
  pendingReviews: number;
  eventReports: number;
  monthlyBreakdown: Array<{
    month: number;
    total: number;
  }>;
}

export interface DashboardRecentActivity {
  id: string;
  action: string;
  module: string;
  description?: string;
  timestamp: Date;
  userId?: string;
}

export interface DashboardSummary {
  totalStudents: number;
  totalFacultyAchievements: number;
  totalPlacements: number;
  totalInternships: number;
  totalPublications: number;
  totalPatents: number;
  pendingReviews: number;
}
