'use client';

import { Clock3, RotateCcw, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SearchHistoryItem } from '@/types/api-models';
import { formatShortDate } from '../utils/smart-search.utils';

interface RecentSearchesProps {
  items: SearchHistoryItem[];
  isLoading?: boolean;
  onReuse: (query: string) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  isClearing?: boolean;
}

export function RecentSearches({
  items,
  isLoading,
  onReuse,
  onDismiss,
  onClearAll,
  isClearing,
}: RecentSearchesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock3 className="size-4 text-primary" aria-hidden="true" />
          Recent Searches
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClearAll} isLoading={isClearing}>
          Clear all
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2"
          >
            <button
              type="button"
              onClick={() => onReuse(item.query)}
              className="min-w-0 flex-1 text-left text-sm transition-colors hover:text-primary"
              aria-label={`Reuse search: ${item.query}`}
            >
              <span className="line-clamp-1 font-medium">{item.query}</span>
              <span className="text-xs text-muted">
                {item.resultCount} results · {formatShortDate(item.searchedAt)}
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReuse(item.query)}
              aria-label="Reuse search"
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDismiss(item._id)}
              aria-label="Remove from recent searches"
            >
              <X className="size-4" />
            </Button>
          </motion.div>
        ))}
        <p className="flex items-center gap-1 text-xs text-muted">
          <Trash2 className="size-3" aria-hidden="true" />
          Remove hides items locally. Clear all deletes server history.
        </p>
      </CardContent>
    </Card>
  );
}
