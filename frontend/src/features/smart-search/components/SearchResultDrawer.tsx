'use client';

import { ExternalLink, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { GlobalSearchResponse, SearchResultItem } from '@/types/api-models';
import {
  formatCollectionLabel,
  getDisplayFields,
  getResultDocuments,
  getResultImageUrl,
  getResultStatus,
  formatShortDate,
} from '../utils/smart-search.utils';

interface SearchResultDrawerProps {
  item: SearchResultItem | null;
  response?: GlobalSearchResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchResultDrawer({ item, response, open, onOpenChange }: SearchResultDrawerProps) {
  if (!item) return null;

  const fields = getDisplayFields(item.data);
  const documents = getResultDocuments(item.data);
  const imageUrl = getResultImageUrl(item.data);
  const status = getResultStatus(item.data);
  const createdAt = item.data?.createdAt ? String(item.data.createdAt) : null;
  const updatedAt = item.data?.updatedAt ? String(item.data.updatedAt) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-6 py-5">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <Badge variant="outline">{formatCollectionLabel(item.collection)}</Badge>
            {status && <Badge variant="secondary">{status}</Badge>}
            {response?.understanding.confidence != null && (
              <Badge variant="success">{response.understanding.confidence}% AI confidence</Badge>
            )}
          </div>
          <SheetTitle className="text-left">{item.summary}</SheetTitle>
          <SheetDescription className="text-left">
            Record ID {item.recordId}
            {item.score != null ? ` · Relevance ${item.score.toFixed(2)}` : ''}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 p-6"
          >
            {imageUrl && (
              <div className="overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Record media" className="max-h-64 w-full object-cover" />
              </div>
            )}

            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="size-4 text-primary" />
                AI Search Context
              </div>
              <p className="mt-2 text-sm text-muted">
                Query: {response?.query ?? '—'}
              </p>
              {response?.understanding.source && (
                <p className="text-sm text-muted">
                  Source: {response.understanding.source}
                  {response.understanding.model ? ` · ${response.understanding.model}` : ''}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Complete Information
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key} className="rounded-lg border border-border bg-card/60 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {field.label}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {documents.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
                  <FileText className="size-4" />
                  Uploaded Documents
                </h3>
                <div className="grid gap-2">
                  {documents.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
                    >
                      <FileText className="size-4 shrink-0 text-primary" />
                      <span className="truncate">{url}</span>
                      <ExternalLink className="ml-auto size-3.5 shrink-0 text-muted" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Timeline</h3>
              <ol className="relative space-y-4 border-l border-border pl-5">
                {createdAt && (
                  <li className="relative">
                    <span className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-primary" />
                    <p className="text-sm font-medium">Record created</p>
                    <p className="text-xs text-muted">{formatShortDate(createdAt)}</p>
                  </li>
                )}
                {updatedAt && updatedAt !== createdAt && (
                  <li className="relative">
                    <span className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-violet-500" />
                    <p className="text-sm font-medium">Last updated</p>
                    <p className="text-xs text-muted">{formatShortDate(updatedAt)}</p>
                  </li>
                )}
                {response?.understanding.source === 'gemini' && (
                  <li className="relative">
                    <span className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-cyan-500" />
                    <p className="text-sm font-medium">Discovered via Smart Search</p>
                    <p className="text-xs text-muted">
                      {response.understanding.confidence != null
                        ? `${response.understanding.confidence}% query confidence`
                        : 'AI-assisted retrieval'}
                    </p>
                  </li>
                )}
              </ol>
            </div>

            {item.data && Object.keys(item.data).length > fields.length && (
              <details className="rounded-lg border border-border bg-card/40 p-4">
                <summary className="cursor-pointer text-sm font-medium">Raw record data</summary>
                <pre className="mt-3 overflow-x-auto text-xs text-muted">
                  {JSON.stringify(item.data, null, 2)}
                </pre>
              </details>
            )}
          </motion.div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
