'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/common/Pagination';
import type { NotificationItem } from '@/types/api-models';
import type { NotificationTimeGroup } from '../types';
import { groupNotificationsByTime } from '../utils/notifications.utils';
import { NotificationCard } from './NotificationCard';

interface NotificationListProps {
  notifications: NotificationItem[];
  isLoading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onMarkRead: (id: string) => void;
  onOpenRelated: (href: string) => void;
  markingReadId?: string | null;
}

function NotificationGroup({
  group,
  items,
  onMarkRead,
  onOpenRelated,
  markingReadId,
  startIndex,
}: {
  group: NotificationTimeGroup;
  items: NotificationItem[];
  onMarkRead: (id: string) => void;
  onOpenRelated: (href: string) => void;
  markingReadId?: string | null;
  startIndex: number;
}) {
  return (
    <section className="space-y-3" aria-label={`${group} notifications`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{group}</h2>
      <div className="space-y-3">
        {items.map((notification, index) => (
          <NotificationCard
            key={notification._id}
            notification={notification}
            index={startIndex + index}
            onMarkRead={onMarkRead}
            onOpenRelated={onOpenRelated}
            isMarkingRead={markingReadId === notification._id}
          />
        ))}
      </div>
    </section>
  );
}

export function NotificationList({
  notifications,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onMarkRead,
  onOpenRelated,
  markingReadId,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const groups = groupNotificationsByTime(notifications);
  let runningIndex = 0;

  return (
    <div className="space-y-6">
      {groups.map(({ group, items }) => {
        const groupElement = (
          <NotificationGroup
            key={group}
            group={group}
            items={items}
            onMarkRead={onMarkRead}
            onOpenRelated={onOpenRelated}
            markingReadId={markingReadId}
            startIndex={runningIndex}
          />
        );
        runningIndex += items.length;
        return groupElement;
      })}

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
