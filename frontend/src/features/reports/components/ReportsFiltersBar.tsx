'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { BackendReportType } from '@/types/api-models';
import type { ReportsFilterState } from '../types';

const REPORT_TYPE_OPTIONS: BackendReportType[] = [
  'Monthly',
  'Placement',
  'Internship',
  'Student Achievement',
  'Faculty Achievement',
  'Completed Event',
];

interface ReportsFiltersBarProps {
  filters: ReportsFilterState;
  onChange: (patch: Partial<ReportsFilterState>) => void;
}

export function ReportsFiltersBar({ filters, onChange }: ReportsFiltersBarProps) {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 md:grid-cols-12">
        <div className="relative md:col-span-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value, page: 1 })}
            placeholder="Search generated reports..."
            className="pl-10"
            aria-label="Search reports"
          />
        </div>

        <div className="md:col-span-2">
          <Select
            value={filters.reportType}
            onValueChange={(value) =>
              onChange({ reportType: value as ReportsFilterState['reportType'], page: 1 })
            }
          >
            <SelectTrigger aria-label="Category filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {REPORT_TYPE_OPTIONS.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onChange({ status: value as ReportsFilterState['status'], page: 1 })
            }
          >
            <SelectTrigger aria-label="Status filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          type="date"
          value={filters.fromDate}
          onChange={(event) => onChange({ fromDate: event.target.value, page: 1 })}
          className="md:col-span-2"
          aria-label="From date"
        />

        <Input
          type="date"
          value={filters.toDate}
          onChange={(event) => onChange({ toDate: event.target.value, page: 1 })}
          className="md:col-span-2"
          aria-label="To date"
        />
      </CardContent>
    </Card>
  );
}

interface ReportsFiltersBarWithActionsProps extends ReportsFiltersBarProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function ReportsFiltersBarWithActions({
  onRefresh,
  isRefreshing,
  ...props
}: ReportsFiltersBarWithActionsProps) {
  return (
    <div className="space-y-3">
      <ReportsFiltersBar {...props} />
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh} isLoading={isRefreshing}>
          Refresh history
        </Button>
      </div>
    </div>
  );
}
