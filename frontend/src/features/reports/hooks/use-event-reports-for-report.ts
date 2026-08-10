'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type { BackendReportType } from '@/types/api-models';

export interface EventReportOption {
  _id: string;
  eventTitle: string;
  eventType?: string;
  date?: string;
  venue?: string;
}

interface EventReportListResponse {
  items: EventReportOption[];
}

const matchesWorkshopKind = (eventType?: string): boolean => {
  const normalized = String(eventType ?? '').trim().toLowerCase();
  if (!normalized) return false;
  return normalized.includes('workshop') || normalized.includes('training') || normalized.includes('fdp');
};

const matchesIndustrialVisitKind = (eventType?: string): boolean => {
  const normalized = String(eventType ?? '').trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.includes('industrial') ||
    normalized.includes('field visit') ||
    normalized.includes('site visit')
  );
};

const filterEventsForReportType = (
  events: EventReportOption[],
  reportType: BackendReportType,
): EventReportOption[] => {
  if (reportType === 'AI Generated Workshop') {
    return events.filter((event) => matchesWorkshopKind(event.eventType));
  }
  if (reportType === 'AI Generated Industrial Visit') {
    return events.filter((event) => matchesIndustrialVisitKind(event.eventType));
  }
  return events;
};

export function useEventReportsForReport(reportType: BackendReportType | null, enabled: boolean) {
  return useQuery({
    queryKey: ['event-reports-for-report', reportType],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<EventReportListResponse>>('/event-reports', {
        params: {
          limit: 100,
          sortBy: 'date',
          sortOrder: 'desc',
        },
      });

      const items = data.data?.items ?? [];
      return filterEventsForReportType(items, reportType!);
    },
    enabled: enabled && Boolean(reportType),
    staleTime: 60_000,
  });
}

export const formatEventReportOptionLabel = (event: EventReportOption): string => {
  const title = event.eventTitle?.trim() || 'Untitled event';
  const parts = [title];

  if (event.date) {
    const date = new Date(event.date);
    if (!Number.isNaN(date.getTime())) {
      parts.push(date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
    }
  }

  if (event.venue?.trim()) {
    parts.push(event.venue.trim());
  }

  return parts.join(' · ');
};
