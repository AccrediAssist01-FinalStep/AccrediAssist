import type { User } from '@/types';
import type { DashboardRecentActivity } from '@/types/api-models';
import type { SearchHistoryItem } from '@/types/api-models';

export type ProfileActivityType =
  | 'approval'
  | 'rejection'
  | 'report'
  | 'search'
  | 'login'
  | 'other';

export interface ProfileActivityItem {
  id: string;
  type: ProfileActivityType;
  title: string;
  description: string;
  timestamp: string;
}

export function getInitials(name?: string): string {
  if (!name) return 'AA';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatMemberSince(value?: string): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value?: string): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function getOnlineStatus(user?: User | null): { label: string; tone: 'online' | 'offline' } {
  if (!user?.isActive) return { label: 'Inactive', tone: 'offline' };
  if (!user.lastLogin) return { label: 'Active', tone: 'online' };

  const lastLoginMs = Date.now() - new Date(user.lastLogin).getTime();
  if (lastLoginMs < 30 * 60_000) return { label: 'Online', tone: 'online' };
  return { label: 'Away', tone: 'offline' };
}

export function getEmployeeId(user?: User | null): string | null {
  if (!user?._id) return null;
  return user._id.slice(-8).toUpperCase();
}

export function classifyActivity(activity: DashboardRecentActivity): ProfileActivityType {
  const text = `${activity.action} ${activity.module} ${activity.description ?? ''}`.toLowerCase();
  if (text.includes('approv')) return 'approval';
  if (text.includes('reject')) return 'rejection';
  if (text.includes('report')) return 'report';
  if (text.includes('login')) return 'login';
  if (text.includes('search')) return 'search';
  return 'other';
}

export function mapDashboardActivity(
  activity: DashboardRecentActivity,
): ProfileActivityItem {
  return {
    id: activity.id,
    type: classifyActivity(activity),
    title: activity.module,
    description: activity.description ?? activity.action,
    timestamp: activity.timestamp,
  };
}

export function mapSearchHistory(item: SearchHistoryItem): ProfileActivityItem {
  return {
    id: item._id,
    type: 'search',
    title: 'Smart Search',
    description: `"${item.query}" · ${item.resultCount} results`,
    timestamp: item.searchedAt,
  };
}

export function getSecurityStatus(user?: User | null): {
  label: string;
  description: string;
  variant: 'success' | 'warning' | 'destructive';
} {
  if (!user?.isActive) {
    return {
      label: 'Account Inactive',
      description: 'Contact your administrator to restore access.',
      variant: 'destructive',
    };
  }
  return {
    label: 'Account Secure',
    description: 'Your credentials and session are protected with JWT authentication.',
    variant: 'success',
  };
}
