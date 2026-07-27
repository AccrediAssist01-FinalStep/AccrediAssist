'use client';

import { Badge } from '@/components/ui/badge';
import { FeaturePageHeader } from '@/components/layout/PageLayout';

interface NotificationsHeaderProps {
  unreadCount?: number;
}

export function NotificationsHeader({ unreadCount = 0 }: NotificationsHeaderProps) {
  return (
    <FeaturePageHeader
      id="notifications-heading"
      title="Notifications"
      description="Stay updated with approvals, AI processing, reports and system activities."
      badge={
        unreadCount > 0 ? (
          <Badge variant="destructive" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount} unread
          </Badge>
        ) : undefined
      }
    />
  );
}
