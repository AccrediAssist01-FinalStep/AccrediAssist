'use client';

import { ExternalLink, FileText, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pendingReviewService } from '@/services/pending-review.service';
import type { PendingRecord } from '@/types/api-models';

interface PendingRecordMediaProps {
  record: PendingRecord;
}

interface MediaDisplayItem {
  id: string;
  type: 'image' | 'pdf' | 'document';
  url: string;
  label?: string;
  caption?: string;
  fileName?: string;
  observation?: string;
}

function isImageUrl(url: string): boolean {
  return (
    (/\.(png|jpe?g|gif|webp|svg)(\?|&|$)/i.test(url) && !/\.pdf(\?|&|$)/i.test(url)) ||
    /\/image\/(upload|download)\//i.test(url) ||
    /[?&]format=(png|jpe?g|gif|webp|svg)/i.test(url)
  );
}

function isPdfUrl(url: string): boolean {
  return (
    /\.pdf(\?|&|$)/i.test(url) ||
    /\/raw\/(upload|download)\//i.test(url) ||
    /[?&]format=pdf/i.test(url)
  );
}

function normalizePdfUrl(url: string): string {
  if (/\/image\/upload\//i.test(url) && /\.pdf(\?.*)?$/i.test(url)) {
    return url.replace('/image/upload/', '/raw/upload/');
  }
  return url;
}

async function openPdfAttachment(recordId: string, fallbackUrl?: string): Promise<void> {
  try {
    const blob = await pendingReviewService.downloadAttachment(recordId);
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    return;
  } catch {
    if (fallbackUrl) {
      window.open(normalizePdfUrl(fallbackUrl), '_blank', 'noopener,noreferrer');
    }
  }
}

function asMediaObject(item: unknown): MediaDisplayItem | null {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  const url = typeof record.url === 'string' ? record.url : '';
  if (!url) return null;

  const rawType = typeof record.type === 'string' ? record.type : '';
  const type =
    rawType === 'pdf' || isPdfUrl(url)
      ? 'pdf'
      : rawType === 'image' || isImageUrl(url)
        ? 'image'
        : 'document';

  return {
    id: `${typeof record.label === 'string' ? record.label : url}-${typeof record.sourceMessageIndex === 'number' ? record.sourceMessageIndex : ''}`,
    type,
    url,
    label: typeof record.label === 'string' ? record.label : undefined,
    caption: typeof record.caption === 'string' ? record.caption : undefined,
    fileName: typeof record.fileName === 'string' ? record.fileName : undefined,
    observation: typeof record.observation === 'string' ? record.observation : undefined,
  };
}

function collectMediaItems(record: PendingRecord): MediaDisplayItem[] {
  const data = record.extractedData ?? {};
  const items: MediaDisplayItem[] = [];
  const seen = new Set<string>();

  const pushItem = (item: MediaDisplayItem | null) => {
    if (!item || seen.has(item.url)) return;
    seen.add(item.url);
    items.push(item);
  };

  if (Array.isArray(data.media)) {
    data.media.forEach((entry) => pushItem(asMediaObject(entry)));
  }

  if (Array.isArray(data.evidence)) {
    data.evidence.forEach((entry) => pushItem(asMediaObject(entry)));
  }

  const photoUrls = Array.isArray(data.photoUrls) ? data.photoUrls : [];
  photoUrls.forEach((url, index) => {
    if (typeof url !== 'string') return;
    pushItem({
      id: `photo-${index}`,
      type: isPdfUrl(url) ? 'pdf' : 'image',
      url,
      label: `Image ${index + 1}`,
    });
  });

  const certificates = Array.isArray(data.certificates) ? data.certificates : [];
  certificates.forEach((url, index) => {
    if (typeof url !== 'string') return;
    pushItem({
      id: `cert-${index}`,
      type: 'pdf',
      url,
      label: `PDF ${index + 1}`,
    });
  });

  const rawMedia = data.media;
  if (typeof rawMedia === 'string') {
    pushItem({
      id: 'legacy-media',
      type: isPdfUrl(rawMedia) ? 'pdf' : 'image',
      url: rawMedia,
    });
  }

  const metadataUrl =
    typeof data.mediaMetadata === 'object' && data.mediaMetadata !== null
      ? String((data.mediaMetadata as { secureUrl?: string }).secureUrl ?? '')
      : '';
  if (metadataUrl) {
    pushItem({
      id: 'legacy-metadata',
      type: isPdfUrl(metadataUrl) ? 'pdf' : 'image',
      url: metadataUrl,
    });
  }

  return items;
}

export function PendingRecordMedia({ record }: PendingRecordMediaProps) {
  const mediaItems = collectMediaItems(record);
  const images = mediaItems.filter((item) => item.type === 'image');
  const documents = mediaItems.filter((item) => item.type === 'pdf' || item.type === 'document');
  const conversation =
    typeof record.extractedData?.conversationTimeline === 'string'
      ? record.extractedData.conversationTimeline
      : record.originalMessage;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">WhatsApp Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-accent/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {conversation}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
            {record.groupName && <Badge variant="outline">{record.groupName}</Badge>}
            {record.senderName && <Badge variant="outline">{record.senderName}</Badge>}
            {mediaItems.length > 0 && (
              <Badge variant="secondary">{mediaItems.length} attachments</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="size-4" />
              Event Images ({images.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {images.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption ?? item.label ?? 'Event image'}
                  className="h-48 w-full object-cover"
                />
                <div className="space-y-1 p-3">
                  {item.label && <p className="text-sm font-medium">{item.label}</p>}
                  {item.caption && <p className="text-sm text-muted-foreground">{item.caption}</p>}
                  {item.observation && (
                    <p className="text-xs text-muted-foreground italic">{item.observation}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              PDFs & Documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {documents.map((item) => {
              const href = normalizePdfUrl(item.url);
              return (
                <div key={item.id} className="rounded-lg border border-border p-3">
                  <button
                    type="button"
                    onClick={() => void openPdfAttachment(record._id, href)}
                    className="flex w-full items-center gap-2 text-left text-sm transition-colors hover:text-primary"
                  >
                    <FileText className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{item.fileName ?? item.label ?? 'Open PDF document'}</span>
                    <ExternalLink className="ml-auto size-3.5 shrink-0 text-muted" />
                  </button>
                  {item.caption && <p className="mt-2 text-xs text-muted-foreground">{item.caption}</p>}
                  {item.observation && (
                    <p className="mt-1 text-xs text-muted-foreground italic">{item.observation}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {mediaItems.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attachments & Media</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">No attachments were included with this submission.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
