'use client';

import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { StatCard } from './StatCard';
import type { DashboardStatItem } from '../types';

const STAT_ICONS: Record<string, LucideIcon> = {
  pendingReviews: ClipboardCheck,
  studentAchievements: GraduationCap,
  facultyAchievements: Award,
  placements: Briefcase,
  internships: Building2,
  publications: BookOpen,
  patents: Lightbulb,
  eventReports: CalendarCheck,
};

interface StatsGridProps {
  stats: DashboardStatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section aria-label="Quick statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.id}
          stat={stat}
          icon={STAT_ICONS[stat.id] ?? ClipboardCheck}
          index={index}
        />
      ))}
    </section>
  );
}
