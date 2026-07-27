'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import {
  EditProfileDialog,
  ProfileActivityTimeline,
  ProfileHeader,
  ProfileInfoCards,
  ProfileSecuritySection,
  useProfileData,
} from '@/features/profile';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const profileQuery = useProfileData(user?._id);

  const profileUser = profileQuery.data?.profile ?? user;

  if (!user) {
    return (
      <ErrorState
        title="Profile unavailable"
        message="Sign in to view your profile information."
      />
    );
  }

  if (profileQuery.isLoading && !profileUser) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (profileQuery.isError || !profileUser) {
    return (
      <ErrorState
        title="Unable to load profile"
        message="We couldn't fetch your profile from the server."
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted">Your institutional identity and account overview</p>
        </div>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/settings">
            <Settings className="size-4" />
            Account Settings
          </Link>
        </Button>
      </div>

      <ProfileHeader user={profileUser} onEditProfile={() => setEditOpen(true)} />
      <ProfileInfoCards user={profileUser} />
      <ProfileSecuritySection user={profileUser} hasActiveSession={Boolean(token)} />
      <ProfileActivityTimeline
        activities={profileQuery.data?.activities ?? []}
        isLoading={profileQuery.isLoading}
      />

      <EditProfileDialog user={profileUser} open={editOpen} onOpenChange={setEditOpen} />
    </motion.div>
  );
}
