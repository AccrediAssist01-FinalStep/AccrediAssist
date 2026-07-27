'use client';

import { motion } from 'framer-motion';
import { Building2, CalendarDays, Edit3, Mail, Shield, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import {
  formatMemberSince,
  getEmployeeId,
  getInitials,
  getOnlineStatus,
} from '../utils/profile.utils';

interface ProfileHeaderProps {
  user: User;
  onEditProfile: () => void;
}

export function ProfileHeader({ user, onEditProfile }: ProfileHeaderProps) {
  const status = getOnlineStatus(user);
  const employeeId = getEmployeeId(user);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-violet-500/5 to-cyan-500/5 p-6 shadow-soft md:p-8"
      aria-label="Profile header"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar className="size-24 border-4 border-card shadow-elevated md:size-28">
              <AvatarImage src={user.profileImage} alt={user.name} />
              <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'absolute bottom-1 right-1 size-4 rounded-full border-2 border-card',
                status.tone === 'online' ? 'bg-success' : 'bg-muted',
              )}
              aria-label={`Status: ${status.label}`}
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{user.name}</h1>
              <Badge>{user.role}</Badge>
              <Badge variant={status.tone === 'online' ? 'success' : 'secondary'}>{status.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              {user.department && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {user.department}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3.5" />
                {user.email}
              </span>
              {employeeId && (
                <span className="inline-flex items-center gap-1">
                  <Shield className="size-3.5" />
                  ID {employeeId}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Member since {formatMemberSince(user.createdAt)}
              </span>
            </div>
            {user.designation && (
              <p className="inline-flex items-center gap-1 text-sm">
                <UserCircle className="size-3.5 text-primary" />
                {user.designation}
              </p>
            )}
          </div>
        </div>

        <Button className="gap-2 self-start lg:self-center" onClick={onEditProfile}>
          <Edit3 className="size-4" />
          Edit Profile
        </Button>
      </div>
    </motion.section>
  );
}
