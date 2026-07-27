'use client';

import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useNotificationMutations,
  useNotifications,
  useUnreadNotificationCount,
} from '@/features/notifications';
import { DEFAULT_NOTIFICATION_FILTERS } from '@/features/notifications';
import { formatNotificationTime } from '@/features/notifications/utils/notifications.utils';

export function NotificationDropdown() {
  const router = useRouter();
  const { markReadMutation } = useNotificationMutations();

  const unreadQuery = useUnreadNotificationCount();
  const unreadCount = unreadQuery.data ?? 0;
  const { data, isLoading, isError } = useNotifications({
    ...DEFAULT_NOTIFICATION_FILTERS,
    limit: 5,
    page: 1,
  });

  const previewItems = data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-[18px]" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 size-4 justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {unreadCount} unread
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && (
          <div className="space-y-2 p-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {isError && (
          <p className="px-2 py-3 text-sm text-muted">Unable to load notifications.</p>
        )}
        {!isLoading && !isError && previewItems.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted">No notifications available.</p>
        )}
        {!isLoading &&
          !isError &&
          previewItems.map((item) => (
            <DropdownMenuItem
              key={item._id}
              className="flex flex-col items-start gap-1 py-3"
              onClick={() => {
                if (!item.isRead) {
                  void markReadMutation.mutateAsync(item._id);
                }
                router.push('/notifications');
              }}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="font-medium">{item.title}</span>
                {!item.isRead && <span className="size-2 rounded-full bg-primary" />}
              </div>
              <span className="line-clamp-2 text-xs text-muted">{item.message}</span>
              <span className="text-[10px] text-muted">{formatNotificationTime(item.createdAt)}</span>
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/notifications')}>
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
