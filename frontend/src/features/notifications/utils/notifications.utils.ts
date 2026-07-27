import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Bell,
  Briefcase,
  CheckCircle2,
  Cpu,
  FileText,
  GraduationCap,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { NotificationItem } from '@/types/api-models';
import type { NotificationCategory, NotificationPriority, NotificationTimeGroup } from '../types';

export function deriveCategory(notification: NotificationItem): NotificationCategory {
  const text = `${notification.title} ${notification.message}`.toLowerCase();

  if (notification.type === 'Approval') return 'Approval';
  if (notification.type === 'Report') return 'Report Generated';
  if (notification.type === 'System' && text.includes('reject')) return 'Rejection';
  if (notification.type === 'AI' && (text.includes('pending') || text.includes('review'))) {
    return 'Pending Review';
  }
  if (notification.type === 'AI') return 'AI Processing';
  if (text.includes('placement')) return 'Placement';
  if (text.includes('internship')) return 'Internship';
  if (text.includes('achievement')) return 'Achievement';
  return 'System';
}

export function derivePriority(notification: NotificationItem): NotificationPriority {
  if (notification.isRead) return 'low';

  const category = deriveCategory(notification);
  if (category === 'Approval' || category === 'Rejection' || category === 'Pending Review') {
    return 'high';
  }
  if (category === 'AI Processing' || category === 'Report Generated') return 'medium';
  return 'low';
}

export function getPriorityLabel(priority: NotificationPriority): string {
  switch (priority) {
    case 'high':
      return 'High Priority';
    case 'medium':
      return 'Medium Priority';
    default:
      return 'Normal';
  }
}

export function getPriorityBadgeVariant(
  priority: NotificationPriority,
): 'destructive' | 'warning' | 'secondary' {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'warning';
    default:
      return 'secondary';
  }
}

export function getCategoryIcon(category: NotificationCategory): LucideIcon {
  switch (category) {
    case 'Approval':
      return CheckCircle2;
    case 'Rejection':
      return XCircle;
    case 'AI Processing':
      return Cpu;
    case 'Pending Review':
      return Sparkles;
    case 'Report Generated':
      return FileText;
    case 'Placement':
      return Briefcase;
    case 'Internship':
      return GraduationCap;
    case 'Achievement':
      return Award;
    default:
      return Bell;
  }
}

export function formatNotificationTime(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getTimeGroup(value: string): NotificationTimeGroup {
  const date = new Date(value);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  if (date >= startOfWeek) return 'Last 7 Days';
  return 'Older';
}

export function groupNotificationsByTime(
  notifications: NotificationItem[],
): Array<{ group: NotificationTimeGroup; items: NotificationItem[] }> {
  const order: NotificationTimeGroup[] = ['Today', 'Yesterday', 'Last 7 Days', 'Older'];
  const grouped = new Map<NotificationTimeGroup, NotificationItem[]>();

  for (const notification of notifications) {
    const group = getTimeGroup(notification.createdAt);
    const items = grouped.get(group) ?? [];
    items.push(notification);
    grouped.set(group, items);
  }

  return order
    .filter((group) => grouped.has(group))
    .map((group) => ({ group, items: grouped.get(group)! }));
}

export function matchesCategory(notification: NotificationItem, category: NotificationCategory): boolean {
  if (category === 'all') return true;
  return deriveCategory(notification) === category;
}

export function matchesPriority(
  notification: NotificationItem,
  priority: NotificationPriority,
): boolean {
  if (priority === 'all') return true;
  return derivePriority(notification) === priority;
}

export function matchesDateFilter(notification: NotificationItem, filter: string): boolean {
  if (filter === 'all') return true;
  const date = new Date(notification.createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (filter === 'today') return getTimeGroup(notification.createdAt) === 'Today';
  if (filter === 'week') return diffDays <= 7;
  if (filter === 'month') return diffDays <= 30;
  return true;
}

export function getRelatedRecordHref(notification: NotificationItem): string | null {
  const category = deriveCategory(notification);
  if (
    category === 'Pending Review' ||
    category === 'Approval' ||
    category === 'Rejection' ||
    category === 'AI Processing'
  ) {
    return '/pending-reviews';
  }
  if (category === 'Report Generated') return '/reports';
  if (category === 'Placement' || category === 'Internship' || category === 'Achievement') {
    return '/search';
  }
  return null;
}

export function getStatusLabel(isRead: boolean): string {
  return isRead ? 'Read' : 'Unread';
}
