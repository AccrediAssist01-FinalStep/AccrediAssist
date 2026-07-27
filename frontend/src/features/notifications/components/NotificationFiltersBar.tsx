'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { NOTIFICATION_CATEGORIES, type NotificationFilterState } from '../types';

interface NotificationFiltersBarProps {
  filters: NotificationFilterState;
  onChange: (patch: Partial<NotificationFilterState>) => void;
}

export function NotificationFiltersBar({ filters, onChange }: NotificationFiltersBarProps) {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 md:grid-cols-12">
        <div className="relative md:col-span-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value, page: 1 })}
            placeholder="Search notifications..."
            className="pl-10"
            aria-label="Search notifications"
          />
        </div>

        <div className="md:col-span-2">
          <Select
            value={filters.read}
            onValueChange={(value) =>
              onChange({ read: value as NotificationFilterState['read'], page: 1 })
            }
          >
            <SelectTrigger aria-label="Read status filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Select
            value={filters.priority}
            onValueChange={(value) =>
              onChange({ priority: value as NotificationFilterState['priority'], page: 1 })
            }
          >
            <SelectTrigger aria-label="Priority filter">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Select
            value={filters.category}
            onValueChange={(value) =>
              onChange({ category: value as NotificationFilterState['category'], page: 1 })
            }
          >
            <SelectTrigger aria-label="Category filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {NOTIFICATION_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Select
            value={filters.date}
            onValueChange={(value) =>
              onChange({ date: value as NotificationFilterState['date'], page: 1 })
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
      </CardContent>
    </Card>
  );
}
