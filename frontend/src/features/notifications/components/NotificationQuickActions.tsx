'use client';

import { CheckCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationQuickActionsProps {
  unreadCount: number;
  onMarkAllRead: () => void;
  onRefresh: () => void;
  isMarkingAll?: boolean;
  isRefreshing?: boolean;
}

export function NotificationQuickActions({
  unreadCount,
  onMarkAllRead,
  onRefresh,
  isMarkingAll,
  isRefreshing,
}: NotificationQuickActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onRefresh}
          isLoading={isRefreshing}
          aria-label="Refresh notifications"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
        <Button
          variant="default"
          size="sm"
          className="gap-2"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          isLoading={isMarkingAll}
          aria-label="Mark all notifications as read"
        >
          <CheckCheck className="size-4" />
          Mark All Read
        </Button>
      </div>
    </div>
  );
}
