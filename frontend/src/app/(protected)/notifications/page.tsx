'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { NoNotificationsIllustration } from '@/components/illustrations';
import {
  DEFAULT_NOTIFICATION_FILTERS,
  NotificationFiltersBar,
  NotificationList,
  NotificationQuickActions,
  NotificationsHeader,
  useNotificationMutations,
  useNotifications,
  type NotificationFilterState,
} from '@/features/notifications';

export default function NotificationsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<NotificationFilterState>(DEFAULT_NOTIFICATION_FILTERS);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);

  const notificationsQuery = useNotifications(filters);
  const { markReadMutation, markAllReadMutation } = useNotificationMutations();

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.meta.unreadCount ?? 0;
  const meta = notificationsQuery.data?.meta;

  const updateFilters = useCallback((patch: Partial<NotificationFilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const handleMarkRead = async (id: string) => {
    setMarkingReadId(id);
    try {
      await markReadMutation.mutateAsync(id);
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-8">
      <NotificationsHeader unreadCount={unreadCount} />

      <NotificationQuickActions
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onRefresh={() => notificationsQuery.refetch()}
        isMarkingAll={markAllReadMutation.isPending}
        isRefreshing={notificationsQuery.isFetching}
      />

      <NotificationFiltersBar filters={filters} onChange={updateFilters} />

      {notificationsQuery.isError ? (
        <ErrorState
          title="Unable to load notifications"
          message="We couldn't fetch your notifications. Please try again."
          onRetry={() => notificationsQuery.refetch()}
        />
      ) : !notificationsQuery.isLoading && notifications.length === 0 ? (
        <EmptyState
          illustration={<NoNotificationsIllustration className="mx-auto size-40" />}
          title="No notifications available."
          description="Approvals, AI processing updates, report generation alerts, and system messages will appear here."
        />
      ) : (
        <NotificationList
          notifications={notifications}
          isLoading={notificationsQuery.isLoading}
          page={meta?.page ?? filters.page}
          totalPages={meta?.totalPages ?? 1}
          onPageChange={(page) => updateFilters({ page })}
          onMarkRead={handleMarkRead}
          onOpenRelated={(href) => router.push(href)}
          markingReadId={markingReadId}
        />
      )}

      {notificationsQuery.isFetching && !notificationsQuery.isLoading && (
        <p className="text-center text-xs text-muted" aria-live="polite">
          Refreshing notifications...
        </p>
      )}
    </motion.div>
  );
}
