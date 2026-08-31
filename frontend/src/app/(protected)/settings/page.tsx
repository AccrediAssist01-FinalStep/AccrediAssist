'use client';

import Link from 'next/link';
import { UserCircle } from 'lucide-react';
import { FeaturePageHeader, PageTransition } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SettingsAccount,
  SettingsAppearance,
  SettingsNotifications,
  SettingsWhatsApp,
  useUserPreferences,
} from '@/features/settings';
import { useAuth } from '@/providers/AuthProvider';

export default function SettingsPage() {
  const { preferences, updatePreferences, isLoaded } = useUserPreferences();
  const { hasPermission } = useAuth();
  const canManageWhatsApp = hasPermission('whatsapp_settings');

  return (
    <PageTransition>
      <FeaturePageHeader
        id="settings-heading"
        title="Settings"
        description="Configure appearance, notifications, WhatsApp connection, and account preferences for AccrediAssist."
        action={
          <Button variant="outline" asChild className="gap-2">
            <Link href="/profile">
              <UserCircle className="size-4" aria-hidden="true" />
              View Profile
            </Link>
          </Button>
        }
      />

      {!isLoaded ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : (
        <>
          <SettingsAppearance />
          <SettingsWhatsApp enabled={canManageWhatsApp} />
          <SettingsNotifications preferences={preferences} onChange={updatePreferences} />
          <SettingsAccount preferences={preferences} onChange={updatePreferences} />
        </>
      )}
    </PageTransition>
  );
}
