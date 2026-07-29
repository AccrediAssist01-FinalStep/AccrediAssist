'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { SubmoduleConfig } from '@/config/modules';
import { FeatureRecordsView } from './FeatureRecordsView';
import { submoduleToFeatureConfig } from '../utils/submodule-config';
import { PageTransition, FeaturePageHeader, SectionCard } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Trophy } from 'lucide-react';

interface SubmoduleActivityViewProps {
  submodule: SubmoduleConfig;
}

function AchievementRepositoryView({ submodule }: SubmoduleActivityViewProps) {
  return (
    <PageTransition>
      <FeaturePageHeader
        title={submodule.label}
        description={submodule.description}
      />
      <SectionCard contentClassName="grid gap-4 sm:grid-cols-2">
        <Link
          href="/student-activities/technical"
          className="rounded-xl border border-border bg-gradient-to-br from-blue-500/10 to-transparent p-6 transition-shadow hover:shadow-elevated"
        >
          <Trophy className="mb-3 size-8 text-primary" />
          <h3 className="font-semibold">Student Achievements</h3>
          <p className="mt-1 text-sm text-muted">Browse all approved student achievement records.</p>
        </Link>
        <Link
          href="/faculty-activities/awards"
          className="rounded-xl border border-border bg-gradient-to-br from-violet-500/10 to-transparent p-6 transition-shadow hover:shadow-elevated"
        >
          <Trophy className="mb-3 size-8 text-primary" />
          <h3 className="font-semibold">Faculty Achievements</h3>
          <p className="mt-1 text-sm text-muted">Browse all approved faculty achievement records.</p>
        </Link>
      </SectionCard>
    </PageTransition>
  );
}

function AccreditationMappingView({ submodule }: SubmoduleActivityViewProps) {
  const frameworks = [
    { name: 'NBA', description: 'National Board of Accreditation criteria mapping', href: '/reports' },
    { name: 'NAAC', description: 'NAAC accreditation evidence and reports', href: '/reports' },
    { name: 'AICTE', description: 'AICTE compliance and documentation', href: '/reports' },
  ];

  return (
    <PageTransition>
      <FeaturePageHeader title={submodule.label} description={submodule.description} />
      <SectionCard contentClassName="grid gap-4 md:grid-cols-3">
        {frameworks.map((framework) => (
          <div
            key={framework.name}
            className="rounded-xl border border-border bg-gradient-to-br from-emerald-500/10 to-transparent p-6"
          >
            <ShieldCheck className="mb-3 size-8 text-primary" />
            <h3 className="font-semibold">{framework.name}</h3>
            <p className="mt-1 text-sm text-muted">{framework.description}</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href={framework.href}>Generate Report</Link>
            </Button>
          </div>
        ))}
      </SectionCard>
    </PageTransition>
  );
}

export function SubmoduleActivityView({ submodule }: SubmoduleActivityViewProps) {
  const router = useRouter();

  useEffect(() => {
    if (submodule.viewType === 'notifications') {
      router.replace('/notifications');
    }
  }, [submodule.viewType, router]);

  if (submodule.viewType === 'notifications') {
    return null;
  }

  if (submodule.viewType === 'repository') {
    return <AchievementRepositoryView submodule={submodule} />;
  }

  if (submodule.viewType === 'accreditation') {
    return <AccreditationMappingView submodule={submodule} />;
  }

  return <FeatureRecordsView config={submoduleToFeatureConfig(submodule)} />;
}
