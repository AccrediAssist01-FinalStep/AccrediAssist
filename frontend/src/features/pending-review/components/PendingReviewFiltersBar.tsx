'use client';

import { RefreshCw } from 'lucide-react';
import { SearchBox } from '@/components/common/SearchBox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { RECORD_CATEGORIES, type PendingReviewFilters } from '../types';

interface PendingReviewFiltersBarProps {
  filters: PendingReviewFilters;
  onChange: (patch: Partial<PendingReviewFilters>) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function PendingReviewFiltersBar({
  filters,
  onChange,
  onRefresh,
  isRefreshing,
}: PendingReviewFiltersBarProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SearchBox
              value={filters.search}
              onChange={(search) => onChange({ search, page: 1 })}
              onSubmit={(search) => onChange({ search, page: 1 })}
              placeholder="Search messages, senders, groups..."
              className="w-full"
            />
          </div>

          <div className="lg:col-span-2">
            <Select
              value={filters.category}
              onValueChange={(value) =>
                onChange({ category: value as PendingReviewFilters['category'], page: 1 })
              }
            >
              <SelectTrigger aria-label="Category filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {RECORD_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onChange({ status: value as PendingReviewFilters['status'], page: 1 })
              }
            >
              <SelectTrigger aria-label="Status filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Queue</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Needs Review">Needs Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select
              value={filters.confidence}
              onValueChange={(value) =>
                onChange({ confidence: value as PendingReviewFilters['confidence'], page: 1 })
              }
            >
              <SelectTrigger aria-label="Confidence filter">
                <SelectValue placeholder="Confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="high">High (80%+)</SelectItem>
                <SelectItem value="medium">Medium (50–79%)</SelectItem>
                <SelectItem value="low">Low (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-1">
            <Select
              value={filters.date}
              onValueChange={(value) =>
                onChange({ date: value as PendingReviewFilters['date'], page: 1 })
              }
            >
              <SelectTrigger aria-label="Date filter">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split(':') as [
                  PendingReviewFilters['sortBy'],
                  PendingReviewFilters['sortOrder'],
                ];
                onChange({ sortBy, sortOrder, page: 1 });
              }}
            >
              <SelectTrigger aria-label="Sort records">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:desc">Newest First</SelectItem>
                <SelectItem value="createdAt:asc">Oldest First</SelectItem>
                <SelectItem value="confidenceScore:desc">Highest Confidence</SelectItem>
                <SelectItem value="confidenceScore:asc">Lowest Confidence</SelectItem>
                <SelectItem value="category:asc">Category A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-1">
            <Button
              variant="outline"
              className="w-full"
              onClick={onRefresh}
              isLoading={isRefreshing}
              aria-label="Refresh records"
            >
              <RefreshCw className="size-4" />
              <span className="hidden xl:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
