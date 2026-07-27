'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  FileText,
  KeyRound,
  MonitorSmartphone,
  Search,
  Shield,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/types';
import { formatDateTime, getSecurityStatus } from '../utils/profile.utils';
import { toast } from 'sonner';

interface ProfileSecuritySectionProps {
  user: User;
  hasActiveSession: boolean;
}

export function ProfileSecuritySection({ user, hasActiveSession }: ProfileSecuritySectionProps) {
  const security = getSecurityStatus(user);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-primary" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-card/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted">
                  Password changes require administrator support — no self-service API is available yet.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.info('Contact your administrator to reset your password.')
                }
              >
                Change Password
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/60 p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 size-4 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Security Status</p>
                  <Badge variant={security.variant}>{security.label}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{security.description}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MonitorSmartphone className="size-4 text-primary" />
            Session & Login
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-card/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Current Session</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={hasActiveSession ? 'success' : 'secondary'}>
                {hasActiveSession ? 'Active' : 'No Session'}
              </Badge>
              <span className="text-sm text-muted">JWT authenticated session</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Recent Login</p>
            <p className="mt-2 text-sm font-medium">{formatDateTime(user.lastLogin)}</p>
            <p className="mt-1 text-xs text-muted">Updated automatically on each successful login</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ProfileActivityTimelineProps {
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
  isLoading?: boolean;
}

const activityIcons = {
  approval: CheckCircle2,
  rejection: XCircle,
  report: FileText,
  search: Search,
  login: MonitorSmartphone,
  other: Shield,
};

export function ProfileActivityTimeline({ activities, isLoading }: ProfileActivityTimelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-lg bg-accent" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            No recent activity recorded for your account yet.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-5">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.type as keyof typeof activityIcons] ?? Shield;
              return (
                <motion.li
                  key={activity.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative"
                >
                  <span className="absolute -left-[1.35rem] top-1 flex size-6 items-center justify-center rounded-full border border-border bg-card">
                    <Icon className="size-3.5 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-muted">{activity.description}</p>
                    <p className="mt-1 text-xs text-muted">{formatDateTime(activity.timestamp)}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
