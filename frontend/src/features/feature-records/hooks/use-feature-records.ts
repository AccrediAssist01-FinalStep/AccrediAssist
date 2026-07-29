'use client';

import { useQuery } from '@tanstack/react-query';
import { featureRecordsService } from '@/services/feature-records.service';
import type { FeatureRecordConfig, FeatureRecordFilters } from '../types';

export function useFeatureRecords(config: FeatureRecordConfig, filters: FeatureRecordFilters) {
  return useQuery({
    queryKey: ['feature-records', config.id, config.listFilters, filters],
    queryFn: () =>
      featureRecordsService.list(config.apiPath, {
        ...filters,
        listFilters: config.listFilters,
      }),
    staleTime: 30_000,
  });
}

export function useFeatureRecord(config: FeatureRecordConfig, id: string | null) {
  return useQuery({
    queryKey: ['feature-record', config.id, id],
    queryFn: () => featureRecordsService.getById(config.apiPath, id!),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}
