'use client';

import { PageHeader } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/common/EmptyState';
import { NoNotificationsIllustration } from '@/components/illustrations';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description="Stay updated on approvals, AI processing, and system alerts."
        action={<Badge variant="destructive">3 unread</Badge>}
      />

      <Card>
        <CardContent className="py-12">
          <EmptyState
            illustration={<NoNotificationsIllustration className="size-36" />}
            title="You're all caught up"
            description="New notifications about record approvals, AI extractions, and report generation will appear here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
