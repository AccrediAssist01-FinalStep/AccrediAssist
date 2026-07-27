'use client';

import { motion } from 'framer-motion';
import { Check, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NotificationItem } from '@/types/api-models';
import {
  deriveCategory,
  derivePriority,
  formatNotificationTime,
  getCategoryIcon,
  getPriorityBadgeVariant,
  getPriorityLabel,
  getRelatedRecordHref,
  getStatusLabel,
} from '../utils/notifications.utils';

interface NotificationCardProps {
  notification: NotificationItem;
  index: number;
  onMarkRead: (id: string) => void;
  onOpenRelated: (href: string) => void;
  isMarkingRead?: boolean;
}

export function NotificationCard({
  notification,
  index,
  onMarkRead,
  onOpenRelated,
  isMarkingRead,
}: NotificationCardProps) {
  const category = deriveCategory(notification);
  const priority = derivePriority(notification);
  const Icon = getCategoryIcon(category);
  const relatedHref = getRelatedRecordHref(notification);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-elevated',
        !notification.isRead && 'border-primary/30 bg-primary/[0.03] ring-1 ring-primary/10',
      )}
      aria-label={`${notification.title}, ${getStatusLabel(notification.isRead)}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            !notification.isRead ? 'bg-primary/15 text-primary' : 'bg-accent text-muted',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{category}</Badge>
            <Badge variant={notification.isRead ? 'secondary' : 'success'}>
              {getStatusLabel(notification.isRead)}
            </Badge>
            {!notification.isRead && (
              <Badge variant={getPriorityBadgeVariant(priority)}>{getPriorityLabel(priority)}</Badge>
            )}
          </div>

          <h3 className="font-semibold tracking-tight">{notification.title}</h3>
          <p className="text-sm leading-relaxed text-muted">{notification.message}</p>
          <p className="text-xs text-muted">{formatNotificationTime(notification.createdAt)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        {!notification.isRead && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onMarkRead(notification._id)}
            isLoading={isMarkingRead}
          >
            <Check className="size-4" />
            Mark as Read
          </Button>
        )}
        {relatedHref && (
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => onOpenRelated(relatedHref)}
          >
            <ExternalLink className="size-4" />
            Open Related Record
          </Button>
        )}
      </div>
    </motion.article>
  );
}
