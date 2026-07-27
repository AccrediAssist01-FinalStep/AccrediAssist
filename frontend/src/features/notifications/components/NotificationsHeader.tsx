'use client';

import { Badge } from '@/components/ui/badge';

interface NotificationsHeaderProps {
  unreadCount?: number;
}

export function NotificationsHeader({ unreadCount = 0 }: NotificationsHeaderProps) {
  return (
    <section className="space-y-3" aria-labelledby="notifications-heading">
      <div className="flex flex-wrap items-center gap-2">
        <h1 id="notifications-heading" className="text-3xl font-bold tracking-tight md:text-4xl">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <Badge variant="destructive" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount} unread
          </Badge>
        )}
      </div>
      <p className="max-w-3xl text-muted">
        Stay updated with approvals, AI processing, reports and system activities.
      </p>
    </section>
  );
}
