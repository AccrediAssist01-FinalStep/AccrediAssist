'use client';

import { ExternalLink, FileText, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FeatureRecord } from '../types';
import {
  collectRecordMediaUrls,
  isImageMediaUrl,
  isPdfMediaUrl,
} from '../utils/record-media.utils';

interface RecordMediaPreviewProps {
  record: FeatureRecord;
}

function MediaTile({ url }: { url: string }) {
  if (isImageMediaUrl(url) && !isPdfMediaUrl(url)) {
    return (
      <div className="overflow-hidden rounded-lg border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Record attachment" className="max-h-72 w-full object-contain bg-muted/20" />
      </div>
    );
  }

  const label = isPdfMediaUrl(url) ? 'Open PDF document' : 'Open attachment';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
    >
      <FileText className="size-4 shrink-0 text-primary" />
      <span className="truncate">{label}</span>
      <ExternalLink className="ml-auto size-3.5 shrink-0 text-muted" />
    </a>
  );
}

export function RecordMediaPreview({ record }: RecordMediaPreviewProps) {
  const mediaUrls = collectRecordMediaUrls(record);

  if (mediaUrls.length === 0) {
    return null;
  }

  const imageUrls = mediaUrls.filter((url) => isImageMediaUrl(url) && !isPdfMediaUrl(url));
  const documentUrls = mediaUrls.filter((url) => !imageUrls.includes(url));

  return (
    <div className="space-y-4">
      {imageUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="size-4" />
              Certificate & Photo Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {imageUrls.map((url) => (
              <MediaTile key={url} url={url} />
            ))}
          </CardContent>
        </Card>
      )}

      {documentUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {documentUrls.map((url) => (
              <MediaTile key={url} url={url} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
