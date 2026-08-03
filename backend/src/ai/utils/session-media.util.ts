import {
  EventMediaItem,
  EventReportSessionMessage,
} from '../../types/eventReportSession.types';
import { ensureCloudinaryConfigured, isCloudinaryConfigured } from '../../config/cloudinary';
import { GeminiMediaPart } from '../interfaces/ai-response.interface';

const fetchBytes = async (url: string): Promise<Buffer | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
};

type SessionMediaMetadata = {
  mimeType?: string;
  contentBase64?: string;
  mediaType?: string;
  secureUrl?: string;
  publicId?: string;
  fileName?: string;
  caption?: string;
  uploadedAt?: Date | string;
};

const getMessageMetadata = (
  message: EventReportSessionMessage,
): SessionMediaMetadata | undefined =>
  message.mediaMetadata as SessionMediaMetadata | undefined;

const resolveMediaUrl = (message: EventReportSessionMessage): string | null =>
  message.media ?? getMessageMetadata(message)?.secureUrl ?? null;

const resolveMediaType = (
  metadata: SessionMediaMetadata | undefined,
): 'image' | 'pdf' | 'document' => {
  const mimeType = metadata?.mimeType?.toLowerCase() ?? '';
  if (mimeType === 'application/pdf' || metadata?.mediaType === 'pdf') return 'pdf';
  if (mimeType.startsWith('image/') || metadata?.mediaType === 'image') return 'image';
  return 'document';
};

const resolveCaption = (message: EventReportSessionMessage): string | undefined => {
  const metadata = getMessageMetadata(message);
  const caption = metadata?.caption?.trim();
  if (caption) return caption;

  const text = message.text?.trim();
  if (!text || text === '(media only)') return undefined;
  return text;
};

export const buildConversationTimeline = (messages: EventReportSessionMessage[]): string =>
  messages
    .map((message, index) => {
      const time = message.receivedAt.toISOString();
      const metadata = getMessageMetadata(message);
      const labelPrefix =
        resolveMediaType(metadata) === 'pdf'
          ? 'PDF'
          : resolveMediaType(metadata) === 'image'
            ? 'Image'
            : 'Document';
      const mediaMessages = messages
        .slice(0, index + 1)
        .filter((item) => resolveMediaUrl(item))
        .length;
      const attachment = message.media
        ? ` [${labelPrefix} ${mediaMessages}: ${message.media}]`
        : '';
      const caption = resolveCaption(message);
      const body = caption || (message.media ? '(media attachment)' : '(no text)');
      return `${index + 1}. [${time}] ${message.sender}: ${body}${attachment}`;
    })
    .join('\n');

/** Build ordered media array — one entry per uploaded file, never overwriting prior items */
export const buildMediaItems = (messages: EventReportSessionMessage[]): EventMediaItem[] => {
  const typeCounters = { image: 0, pdf: 0, document: 0 };
  const items: EventMediaItem[] = [];

  messages.forEach((message, index) => {
    const url = resolveMediaUrl(message);
    if (!url) return;

    const metadata = getMessageMetadata(message);
    const type = resolveMediaType(metadata);
    typeCounters[type] += 1;
    const labelPrefix = type === 'pdf' ? 'PDF' : type === 'image' ? 'Image' : 'Document';

    const uploadedAt =
      message.receivedAt instanceof Date
        ? message.receivedAt.toISOString()
        : metadata?.uploadedAt
          ? new Date(metadata.uploadedAt).toISOString()
          : new Date().toISOString();

    items.push({
      type,
      url,
      caption: resolveCaption(message),
      fileName: metadata?.fileName,
      mimeType: metadata?.mimeType,
      uploadedAt,
      label: `${labelPrefix} ${typeCounters[type]}`,
      sourceMessageIndex: index,
    });
  });

  return items;
};

export const buildEvidenceItems = (
  messages: EventReportSessionMessage[],
): Array<{
  type: 'image' | 'pdf' | 'document';
  label: string;
  url: string;
  mimeType?: string;
  fileName?: string;
  caption?: string;
  uploadedAt?: string;
  sourceMessageIndex: number;
}> =>
  buildMediaItems(messages).map(({ observation: _observation, ...item }) => item);

export const resolveSessionMediaParts = async (
  messages: EventReportSessionMessage[],
): Promise<GeminiMediaPart[]> => {
  const parts: GeminiMediaPart[] = [];

  for (const message of messages) {
    const metadata = getMessageMetadata(message);
    const mimeType = metadata?.mimeType?.toLowerCase() ?? '';
    const isPdf = mimeType === 'application/pdf' || metadata?.mediaType === 'pdf';
    const isImage = mimeType.startsWith('image/') || metadata?.mediaType === 'image';

    if (metadata?.contentBase64 && (isImage || isPdf)) {
      parts.push({
        mimeType: isPdf ? 'application/pdf' : metadata.mimeType ?? 'image/jpeg',
        inlineData: metadata.contentBase64,
      });
      continue;
    }

    const mediaUrl = resolveMediaUrl(message);
    if (!mediaUrl) continue;

    if (isPdf || isImage) {
      const publicId = metadata?.publicId;
      if (publicId && isCloudinaryConfigured()) {
        const cloudinary = await ensureCloudinaryConfigured();
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        const deliveryPublicId =
          isImage && publicId.includes('.') ? publicId.replace(/\.[^/.]+$/, '') : publicId;
        const format = isPdf ? 'pdf' : 'jpg';
        const privateUrl = cloudinary.utils.private_download_url(deliveryPublicId, format, {
          resource_type: isPdf ? 'raw' : 'image',
          type: 'upload',
          expires_at: expiresAt,
        });
        const bytes = await fetchBytes(privateUrl);
        if (bytes?.length) {
          parts.push({
            mimeType: isPdf ? 'application/pdf' : metadata?.mimeType ?? 'image/jpeg',
            inlineData: bytes.toString('base64'),
          });
          continue;
        }
      }

      parts.push({
        url: mediaUrl,
        mimeType: isPdf ? 'application/pdf' : metadata?.mimeType ?? 'image/jpeg',
      });
    }
  }

  return parts;
};

export const countSessionMedia = (messages: EventReportSessionMessage[]) => {
  const media = buildMediaItems(messages);
  return {
    total: media.length,
    images: media.filter((item) => item.type === 'image').length,
    pdfs: media.filter((item) => item.type === 'pdf').length,
    documents: media.filter((item) => item.type === 'document').length,
  };
};
