'use client';

import { useQuery } from '@tanstack/react-query';
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
import { notificationService } from '@/services/notification.service';

export function NotificationDropdown() {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications-preview'],
    queryFn: () => notificationService.getNotifications(1, 5),
    staleTime: 30_000,
    retry: 1,
  });

  const unreadCount = data?.items.filter((item) => !item.isRead).length ?? 0;

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
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
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
        {!isLoading && !isError && data?.items.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted">You&apos;re all caught up.</p>
        )}
        {!isLoading &&
          !isError &&
          data?.items.map((item) => (
            <DropdownMenuItem key={item._id} className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">{item.title}</span>
              <span className="line-clamp-2 text-xs text-muted">{item.message}</span>
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
