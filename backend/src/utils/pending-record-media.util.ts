import type { EventMediaItem } from '../types/eventReportSession.types';
import type { IPendingRecordResponse } from '../types/pendingRecord.types';
import type { WhatsAppIncomingMessage } from '../whatsapp/types';
import {
  signCloudinaryDeliveryUrl,
  signCloudinaryDeliveryUrls,
} from './cloudinary-url.util';

const resolveMediaType = (
  metadata: WhatsAppIncomingMessage['mediaMetadata'],
  url: string | null,
): EventMediaItem['type'] => {
  const mimeType = metadata?.mimeType?.toLowerCase() ?? '';
  if (metadata?.mediaType === 'pdf' || mimeType === 'application/pdf' || (url && /\.pdf(\?|&|$)/i.test(url))) {
    return 'pdf';
  }
  if (
    metadata?.mediaType === 'image' ||
    mimeType.startsWith('image/') ||
    (url && /\/image\/(upload|download)\//i.test(url))
  ) {
    return 'image';
  }
  if (metadata?.mediaType === 'document') {
    return 'document';
  }
  return url ? 'image' : 'document';
};

export const buildPendingMessageMediaFields = (
  message: WhatsAppIncomingMessage,
): {
  media: EventMediaItem[] | string | null;
  photoUrls: string[];
  mediaReferences: string[];
} => {
  const url = message.media ?? message.mediaMetadata?.secureUrl ?? null;
  const metadata = message.mediaMetadata;
  const mediaReferences = new Set<string>();

  for (const candidate of [url, metadata?.secureUrl, message.media]) {
    if (candidate) mediaReferences.add(candidate);
  }

  if (!url) {
    return {
      media: null,
      photoUrls: [],
      mediaReferences: [...mediaReferences],
    };
  }

  const type = resolveMediaType(metadata, url);
  const items: EventMediaItem[] = [
    {
      type,
      url,
      caption: metadata?.caption,
      fileName: metadata?.fileName,
      mimeType: metadata?.mimeType,
      uploadedAt:
        metadata?.uploadedAt instanceof Date
          ? metadata.uploadedAt.toISOString()
          : new Date().toISOString(),
      label: type === 'pdf' ? 'PDF 1' : type === 'image' ? 'Image 1' : 'Document 1',
      sourceMessageIndex: 0,
    },
  ];

  return {
    media: items,
    photoUrls: type === 'image' ? [url] : [],
    mediaReferences: [...mediaReferences],
  };
};

export const mergePendingMediaReferences = (
  existing: string[] | null | undefined,
  additions: string[],
): string[] | null => {
  const merged = new Set<string>(existing ?? []);
  additions.forEach((item) => merged.add(item));
  return merged.size > 0 ? [...merged] : null;
};

export const signPendingRecordMedia = async (
  record: IPendingRecordResponse,
): Promise<IPendingRecordResponse> => {
  const data = { ...(record.extractedData ?? {}) };
  const metadata =
    typeof data.mediaMetadata === 'object' && data.mediaMetadata !== null
      ? { ...(data.mediaMetadata as Record<string, unknown>) }
      : null;

  if (typeof data.media === 'string') {
    data.media = (await signCloudinaryDeliveryUrl(data.media)) ?? data.media;
  }

  if (Array.isArray(data.mediaReferences)) {
    data.mediaReferences = await signCloudinaryDeliveryUrls(
      data.mediaReferences.filter((item): item is string => typeof item === 'string'),
    );
  }

  if (Array.isArray(data.certificates)) {
    data.certificates = await signCloudinaryDeliveryUrls(
      data.certificates.filter((item): item is string => typeof item === 'string'),
    );
  }

  if (typeof data.originalPdfUrl === 'string') {
    data.originalPdfUrl =
      (await signCloudinaryDeliveryUrl(data.originalPdfUrl)) ?? data.originalPdfUrl;
  }

  if (metadata && typeof metadata.secureUrl === 'string') {
    metadata.secureUrl =
      (await signCloudinaryDeliveryUrl(metadata.secureUrl)) ?? metadata.secureUrl;
    data.mediaMetadata = metadata;
  }

  if (Array.isArray(data.media)) {
    data.media = await Promise.all(
      data.media.map(async (item) => {
        if (!item || typeof item !== 'object') return item;
        const mediaItem = { ...(item as Record<string, unknown>) };
        if (typeof mediaItem.url === 'string') {
          mediaItem.url =
            (await signCloudinaryDeliveryUrl(mediaItem.url)) ?? mediaItem.url;
        }
        return mediaItem;
      }),
    );
  }

  if (Array.isArray(data.evidence)) {
    data.evidence = await Promise.all(
      data.evidence.map(async (item) => {
        if (!item || typeof item !== 'object') return item;
        const evidenceItem = { ...(item as Record<string, unknown>) };
        if (typeof evidenceItem.url === 'string') {
          evidenceItem.url =
            (await signCloudinaryDeliveryUrl(evidenceItem.url)) ?? evidenceItem.url;
        }
        return evidenceItem;
      }),
    );
  }

  if (Array.isArray(data.photoUrls)) {
    data.photoUrls = await signCloudinaryDeliveryUrls(
      data.photoUrls.filter((item): item is string => typeof item === 'string'),
    );
  }

  return { ...record, extractedData: data };
};
