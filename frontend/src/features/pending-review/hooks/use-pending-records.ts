'use client';

import { useQuery } from '@tanstack/react-query';
import { pendingReviewService } from '@/services/pending-review.service';
import { dashboardService } from '@/services/dashboard.service';
import type { PendingRecord } from '@/types/api-models';
import type { PendingReviewFilters, PendingReviewHeaderStats, PendingReviewListResult } from '../types';
import {
  isActiveReviewStatus,
  matchesConfidenceFilter,
  matchesDateFilter,
} from '../utils/pending-review.utils';

function sortRecords(records: PendingRecord[], sortBy: PendingReviewFilters['sortBy'], sortOrder: 'asc' | 'desc') {
  const direction = sortOrder === 'asc' ? 1 : -1;

  return [...records].sort((a, b) => {
    switch (sortBy) {
      case 'confidenceScore':
        return (a.confidenceScore - b.confidenceScore) * direction;
      case 'category':
        return a.category.localeCompare(b.category) * direction;
      case 'status':
        return a.status.localeCompare(b.status) * direction;
      case 'senderName':
        return (a.senderName ?? '').localeCompare(b.senderName ?? '') * direction;
      case 'createdAt':
      default:
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
    }
  });
}

function paginateRecords(records: PendingRecord[], page: number, limit: number) {
  const total = records.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * limit;

  return {
    items: records.slice(start, start + limit),
    meta: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  };
}

async function fetchActiveQueue(filters: PendingReviewFilters): Promise<PendingReviewListResult> {
  const [pendingResult, needsReviewResult] = await Promise.all([
    pendingReviewService.list({
      page: 1,
      limit: 100,
      search: filters.search || undefined,
      category: filters.category === 'all' ? undefined : filters.category,
      status: 'Pending',
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }),
    pendingReviewService.list({
      page: 1,
      limit: 100,
      search: filters.search || undefined,
      category: filters.category === 'all' ? undefined : filters.category,
      status: 'Needs Review',
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }),
  ]);

  const merged = [...pendingResult.items, ...needsReviewResult.items];
  const unique = Array.from(new Map(merged.map((item) => [item._id, item])).values());

  const filtered = unique.filter(
    (record) =>
      isActiveReviewStatus(record.status) &&
      matchesConfidenceFilter(record.confidenceScore, filters.confidence) &&
      matchesDateFilter(record.createdAt, filters.date),
  );

  const sorted = sortRecords(filtered, filters.sortBy, filters.sortOrder);
  return paginateRecords(sorted, filters.page, filters.limit);
}

async function fetchServerList(filters: PendingReviewFilters): Promise<PendingReviewListResult> {
  const result = await pendingReviewService.list({
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    category: filters.category === 'all' ? undefined : filters.category,
    status:
      filters.status === 'active' || filters.status === 'all' ? undefined : filters.status,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  let items = result.items;

  if (filters.status === 'active') {
    items = items.filter((record) => isActiveReviewStatus(record.status));
  }

  items = items.filter(
    (record) =>
      matchesConfidenceFilter(record.confidenceScore, filters.confidence) &&
      matchesDateFilter(record.createdAt, filters.date),
  );

  if (filters.confidence !== 'all' || filters.date !== 'all' || filters.status === 'active') {
    return paginateRecords(items, 1, filters.limit);
  }

  return {
    items,
    meta: result.meta,
  };
}

export function usePendingRecords(filters: PendingReviewFilters) {
  const usesClientPipeline =
    filters.status === 'active' || filters.confidence !== 'all' || filters.date !== 'all';

  return useQuery({
    queryKey: ['pending-records', filters],
    queryFn: async () => {
      if (usesClientPipeline && filters.status === 'active') {
        return fetchActiveQueue(filters);
      }
      return fetchServerList(filters);
    },
    staleTime: 30_000,
  });
}

export function usePendingRecord(id: string | null) {
  return useQuery({
    queryKey: ['pending-record', id],
    queryFn: () => pendingReviewService.getById(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function usePendingReviewStats() {
  return useQuery({
    queryKey: ['pending-review-stats'],
    queryFn: async (): Promise<PendingReviewHeaderStats> => {
      const [totalPending, approvedResult, rejectedResult, pendingResult, needsReviewResult] =
        await Promise.all([
          dashboardService.getTotalPendingReviews(),
          pendingReviewService.list({ status: 'Approved', limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
          pendingReviewService.list({ status: 'Rejected', limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
          pendingReviewService.list({ status: 'Pending', limit: 100 }),
          pendingReviewService.list({ status: 'Needs Review', limit: 100 }),
        ]);

      const approvedToday = approvedResult.items.filter(
        (record) => record.reviewedAt && new Date(record.reviewedAt).toDateString() === new Date().toDateString(),
      ).length;

      const rejectedToday = rejectedResult.items.filter(
        (record) => record.reviewedAt && new Date(record.reviewedAt).toDateString() === new Date().toDateString(),
      ).length;

      const activeRecords = [...pendingResult.items, ...needsReviewResult.items];
      const averageConfidence =
        activeRecords.length > 0
          ? Math.round(
              activeRecords.reduce((sum, record) => sum + record.confidenceScore, 0) / activeRecords.length,
            )
          : null;

      return {
        totalPending,
        approvedToday,
        rejectedToday,
        averageConfidence,
      };
    },
    staleTime: 60_000,
  });
}
