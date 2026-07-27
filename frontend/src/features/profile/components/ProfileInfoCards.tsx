'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/types';
import { formatDateTime } from '../utils/profile.utils';

interface InfoCardProps {
  title: string;
  icon: ReactNode;
  items: Array<{ label: string; value: string }>;
  index: number;
}

function InfoCard({ title, icon, items, index }: InfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
    >
      <Card className="h-full shadow-soft transition-shadow hover:shadow-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-card/60 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{item.label}</p>
              <p className="mt-1 text-sm font-medium">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ProfileInfoCardsProps {
  user: User;
}

export function ProfileInfoCards({ user }: ProfileInfoCardsProps) {
  const cards = [
    {
      title: 'Personal Information',
      icon: <UserIcon className="size-4 text-primary" />,
      items: [
        { label: 'Full Name', value: user.name },
        { label: 'Email Address', value: user.email },
        { label: 'Designation', value: user.designation ?? '—' },
      ],
    },
    {
      title: 'Department Information',
      icon: <Building2 className="size-4 text-primary" />,
      items: [
        { label: 'Department', value: user.department ?? '—' },
        { label: 'Institution Role', value: user.role },
        { label: 'Member Since', value: formatDateTime(user.createdAt).split(',')[0] ?? '—' },
      ],
    },
    {
      title: 'Contact Information',
      icon: <Mail className="size-4 text-primary" />,
      items: [
        { label: 'Primary Email', value: user.email },
        { label: 'Last Updated', value: formatDateTime(user.updatedAt) },
        { label: 'Profile Image', value: user.profileImage ? 'Configured' : 'Default avatar' },
      ],
    },
    {
      title: 'Account Status',
      icon: <ShieldCheck className="size-4 text-primary" />,
      items: [
        { label: 'Status', value: user.isActive ? 'Active' : 'Inactive' },
        { label: 'Role', value: user.role },
        {
          label: 'Access Level',
          value:
            user.role === 'Admin'
              ? 'Full administrative access'
              : user.role === 'Faculty'
                ? 'Faculty review and submission access'
                : 'Institutional read access',
        },
      ],
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <InfoCard key={card.title} {...card} index={index} />
      ))}
      <div className="md:col-span-2 xl:col-span-4">
        <Badge variant="outline" className="text-xs">
          Profile fields are synced from your institution directory via GET /auth/profile
        </Badge>
      </div>
    </div>
  );
}
