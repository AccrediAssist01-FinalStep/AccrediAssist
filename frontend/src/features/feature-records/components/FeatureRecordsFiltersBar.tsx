'use client';

import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FeatureRecordFilters } from '../types';
import {
  buildYearOptions,
  getFeatureListProfile,
  type FeatureListProfile,
} from '../utils/feature-list-profile';

interface FeatureRecordsFiltersBarProps {
  apiPath: string;
  filters: FeatureRecordFilters;
  searchPlaceholder: string;
  onChange: (patch: Partial<FeatureRecordFilters>) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function FeatureRecordsFiltersBar({
  apiPath,
  filters,
  searchPlaceholder,
  onChange,
  onRefresh,
  isRefreshing,
}: FeatureRecordsFiltersBarProps) {
  const profile: FeatureListProfile = getFeatureListProfile(apiPath);
  const yearOptions = buildYearOptions();

  return (
    <div className="space-y-3">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          onChange({ page: 1 });
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value, page: 1 })}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label="Search records"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <Button type="button" variant="outline" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          value={String(filters.year)}
          onValueChange={(value) =>
            onChange({ year: value === 'all' ? 'all' : Number(value), page: 1 })
          }
        >
          <SelectTrigger aria-label="Filter by year">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sortBy}
          onValueChange={(value) => onChange({ sortBy: value, page: 1 })}
        >
          <SelectTrigger aria-label="Sort by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {profile.sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sortOrder}
          onValueChange={(value) =>
            onChange({ sortOrder: value as FeatureRecordFilters['sortOrder'], page: 1 })
          }
        >
          <SelectTrigger aria-label="Sort order">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(filters.limit)}
          onValueChange={(value) => onChange({ limit: Number(value), page: 1 })}
        >
          <SelectTrigger aria-label="Results per page">
            <SelectValue placeholder="Page size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
