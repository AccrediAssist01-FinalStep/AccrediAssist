'use client';

import { ExternalLink, FileText, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pendingReviewService } from '@/services/pending-review.service';
import type { PendingRecord } from '@/types/api-models';

interface PendingRecordMediaProps {
  record: PendingRecord;
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

export function PendingRecordMedia({ record }: PendingRecordMediaProps) {
  const data = record.extractedData;
  const certificates = data?.certificates ?? [];
  const mediaReferences = data?.mediaReferences ?? [];
  const rawMedia = data?.media;
  const metadataUrl =
    typeof data?.mediaMetadata === 'object' && data.mediaMetadata !== null
      ? String((data.mediaMetadata as { secureUrl?: string }).secureUrl ?? '')
      : '';
  const mediaItems = Array.isArray(rawMedia) ? rawMedia : rawMedia ? [rawMedia] : [];
  const imageUrls = [
    ...mediaReferences,
    ...mediaItems.filter((item): item is string => typeof item === 'string'),
    ...(metadataUrl ? [metadataUrl] : []),
  ].filter((url, index, list) => list.indexOf(url) === index);

  const hasContent = certificates.length > 0 || imageUrls.length > 0;

  if (!hasContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attachments & Media</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">No attachments were included with this submission.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">WhatsApp Message Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-accent/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {record.originalMessage}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
            {record.groupName && <Badge variant="outline">{record.groupName}</Badge>}
            {record.senderName && <Badge variant="outline">{record.senderName}</Badge>}
          </div>
        </CardContent>
      </Card>

      {certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              Certificates & Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {certificates.map((url) => {
              const href = normalizePdfUrl(url);
              if (isPdfUrl(href)) {
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => void openPdfAttachment(record._id, href)}
                    className="flex w-full items-center gap-2 rounded-lg border border-border p-3 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <FileText className="size-4 shrink-0 text-primary" />
                    <span className="truncate">Open PDF document</span>
                    <ExternalLink className="ml-auto size-3.5 shrink-0 text-muted" />
                  </button>
                );
              }

              return (
              <a
                key={url}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
              >
                <FileText className="size-4 shrink-0 text-primary" />
                <span className="truncate">{href}</span>
                <ExternalLink className="ml-auto size-3.5 shrink-0 text-muted" />
              </a>
            );
            })}
          </CardContent>
        </Card>
      )}

      {imageUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="size-4" />
              Media Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {imageUrls.map((reference) => {
              const href = normalizePdfUrl(reference);
              return isImageUrl(reference) && !isPdfUrl(href) ? (
                <div key={reference} className="overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reference} alt="Uploaded media" className="h-40 w-full object-cover" />
                </div>
              ) : isPdfUrl(href) ? (
                <button
                  key={reference}
                  type="button"
                  onClick={() => void openPdfAttachment(record._id, href)}
                  className="flex w-full items-center gap-2 rounded-lg border border-border p-3 text-left text-sm transition-colors hover:bg-accent"
                >
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="truncate">Open PDF document</span>
                  <ExternalLink className="ml-auto size-3.5 shrink-0 text-muted" />
                </button>
              ) : (
                <a
                  key={reference}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
                >
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{isPdfUrl(href) ? 'Open PDF document' : href}</span>
                  <ExternalLink className="ml-auto size-3.5 shrink-0 text-muted" />
                </a>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
