'use client';

import { ExternalLink, FileText, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PendingRecord } from '@/types/api-models';

interface PendingRecordMediaProps {
  record: PendingRecord;
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
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
            {certificates.map((url) => (
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
            {imageUrls.map((reference) =>
              isImageUrl(reference) ? (
                <div key={reference} className="overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reference} alt="Uploaded media" className="h-40 w-full object-cover" />
                </div>
              ) : (
                <a
                  key={reference}
                  href={reference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
                >
                  <span className="truncate">{reference}</span>
                  <ExternalLink className="ml-auto size-3.5 shrink-0 text-muted" />
                </a>
              ),
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
