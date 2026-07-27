'use client';

import { motion } from 'framer-motion';
import { ChevronRight, ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/common/Pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/common/Table';
import type { SearchResultItem } from '@/types/api-models';
import {
  formatCollectionLabel,
  getPrimaryColumn,
  getResultImageUrl,
  getResultStatus,
  getSecondaryColumn,
} from '../utils/smart-search.utils';

interface SearchResultsTableProps {
  items: SearchResultItem[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelect: (item: SearchResultItem) => void;
  selectedId?: string | null;
}

function getStatusVariant(status: string): 'success' | 'warning' | 'destructive' | 'secondary' {
  const normalized = status.toLowerCase();
  if (normalized.includes('approved') || normalized.includes('active') || normalized.includes('granted')) {
    return 'success';
  }
  if (normalized.includes('pending') || normalized.includes('review')) {
    return 'warning';
  }
  if (normalized.includes('reject') || normalized.includes('expired')) {
    return 'destructive';
  }
  return 'secondary';
}

export function SearchResultsTable({
  items,
  page,
  totalPages,
  onPageChange,
  onSelect,
  selectedId,
}: SearchResultsTableProps) {
  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Record</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableEmpty colSpan={5}>No matching records in the current view.</TableEmpty>
            ) : (
              items.map((item) => {
                const imageUrl = getResultImageUrl(item.data);
                const status = getResultStatus(item.data);

                return (
                  <TableRow
                    key={item.recordId}
                    className="cursor-pointer"
                    data-state={selectedId === item.recordId ? 'selected' : undefined}
                    onClick={() => onSelect(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelect(item);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open details for ${item.summary}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 rounded-lg">
                          {imageUrl ? (
                            <AvatarImage src={imageUrl} alt="" />
                          ) : (
                            <AvatarFallback className="rounded-lg bg-primary/10">
                              <ImageIcon className="size-4 text-primary" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{getPrimaryColumn(item)}</p>
                          <p className="line-clamp-1 text-xs text-muted">{item.summary}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatCollectionLabel(item.collection)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted">
                      {getSecondaryColumn(item)}
                    </TableCell>
                    <TableCell>
                      {status ? (
                        <Badge variant={getStatusVariant(status)}>{status}</Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted">
                      {item.score != null ? item.score.toFixed(2) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((item, index) => {
          const imageUrl = getResultImageUrl(item.data);
          const status = getResultStatus(item.data);

          return (
            <motion.button
              key={item.recordId}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onSelect(item)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-all hover:shadow-elevated"
            >
              <Avatar className="size-12 rounded-lg">
                {imageUrl ? (
                  <AvatarImage src={imageUrl} alt="" />
                ) : (
                  <AvatarFallback className="rounded-lg bg-primary/10">
                    <ImageIcon className="size-4 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{formatCollectionLabel(item.collection)}</Badge>
                  {status && <Badge variant={getStatusVariant(status)}>{status}</Badge>}
                </div>
                <p className="mt-1 truncate font-medium">{getPrimaryColumn(item)}</p>
                <p className="line-clamp-2 text-sm text-muted">{item.summary}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted" />
            </motion.button>
          );
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
