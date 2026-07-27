import type { DashboardMonthlyStatistics } from '@/types/api-models';
import { MONTH_LABELS } from '../types';

export const toMonthlyTrendPoints = (records: DashboardMonthlyStatistics[]) =>
  records.map((record) => ({
    month: MONTH_LABELS[record.month - 1] ?? `${record.month}`,
    placements: record.placements,
    internships: record.internships,
    studentAchievements: record.studentAchievements,
    facultyAchievements: record.facultyAchievements,
    publications: record.publications,
    pendingReviews: record.pendingReviews,
  }));

export const getGreeting = (date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const formatDashboardDate = (date = new Date()): string =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export const formatActivityTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getActivityTone = (
  action: string,
): 'success' | 'warning' | 'danger' | 'default' => {
  const normalized = action.toUpperCase();
  if (normalized.includes('APPROVE')) return 'success';
  if (normalized.includes('REJECT')) return 'danger';
  if (normalized.includes('PENDING') || normalized.includes('REVIEW')) return 'warning';
  return 'default';
};
