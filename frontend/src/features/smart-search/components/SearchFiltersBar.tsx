'use client';

import { Download, Search } from 'lucide-react';
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
import { COLLECTION_LABELS, type SearchSort, type SmartSearchState } from '../types';

interface SearchFiltersBarProps {
  state: SmartSearchState;
  onChange: (patch: Partial<SmartSearchState>) => void;
  onExport: () => void;
  canExport: boolean;
}

export function SearchFiltersBar({ state, onChange, onExport, canExport }: SearchFiltersBarProps) {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 md:grid-cols-12">
        <div className="relative md:col-span-5">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={state.tableFilter}
            onChange={(event) => onChange({ tableFilter: event.target.value })}
            placeholder="Filter current results..."
            className="pl-10"
            aria-label="Filter search results"
          />
        </div>

        <Select
          value={state.collection}
          onValueChange={(value) => onChange({ collection: value, page: 1 })}
        >
          <SelectTrigger className="md:col-span-3" aria-label="Collection filter">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {Object.entries(COLLECTION_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={state.sort}
          onValueChange={(value) => onChange({ sort: value as SearchSort, page: 1 })}
        >
          <SelectTrigger className="md:col-span-2" aria-label="Sort order">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="md:col-span-2"
          onClick={onExport}
          disabled={!canExport}
          aria-label="Export results to CSV"
        >
          <Download className="size-4" />
          Export
        </Button>
      </CardContent>
    </Card>
  );
}
