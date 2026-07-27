'use client';

import type { ReactNode } from 'react';
import { Bell, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { UserPreferences } from '../types';

interface SettingsNotificationsProps {
  preferences: UserPreferences;
  onChange: (patch: Partial<UserPreferences>) => void;
}

function PreferenceToggle({
  title,
  description,
  enabled,
  onToggle,
  icon,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      <Button
        variant={enabled ? 'default' : 'outline'}
        size="sm"
        onClick={onToggle}
        aria-pressed={enabled}
      >
        {enabled ? 'On' : 'Off'}
      </Button>
    </div>
  );
}

export function SettingsNotifications({ preferences, onChange }: SettingsNotificationsProps) {
  const handleToggle = (key: keyof UserPreferences, label: string) => {
    onChange({ [key]: !preferences[key] });
    toast.success(`${label} preference saved locally`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Stored on this device until backend preference APIs are available
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PreferenceToggle
          title="Email Notifications"
          description="Receive email alerts for pending reviews and report generation"
          enabled={preferences.emailNotifications}
          onToggle={() => handleToggle('emailNotifications', 'Email notifications')}
          icon={<Mail className="size-4" />}
        />
        <Separator />
        <PreferenceToggle
          title="Push Notifications"
          description="Browser notifications for real-time institutional updates"
          enabled={preferences.pushNotifications}
          onToggle={() => handleToggle('pushNotifications', 'Push notifications')}
          icon={<Bell className="size-4" />}
        />
      </CardContent>
    </Card>
  );
}
