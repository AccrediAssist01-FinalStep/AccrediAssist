'use client';

import { notFound, useParams } from 'next/navigation';
import { getSubmodule, type ErpModuleId } from '@/config/modules';
import { SubmoduleActivityView } from '@/features/feature-records/components/SubmoduleActivityView';

interface ActivitySlugPageProps {
  moduleId: ErpModuleId;
}

export function ActivitySlugPage({ moduleId }: ActivitySlugPageProps) {
  const params = useParams<{ slug: string }>();
  const submodule = getSubmodule(moduleId, params.slug);

  if (!submodule) {
    notFound();
  }

  return <SubmoduleActivityView submodule={submodule} />;
}
