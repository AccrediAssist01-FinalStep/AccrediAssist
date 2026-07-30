import { EventReportSessionMessage } from '../../types/eventReportSession.types';
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

export const buildConversationTimeline = (messages: EventReportSessionMessage[]): string =>
  messages
    .map((message, index) => {
      const time = message.receivedAt.toISOString();
      const attachment = message.media ? ` [attachment: ${message.media}]` : '';
      return `${index + 1}. [${time}] ${message.sender}: ${message.text || '(media only)'}${attachment}`;
    })
    .join('\n');

export const resolveSessionMediaParts = async (
  messages: EventReportSessionMessage[],
): Promise<GeminiMediaPart[]> => {
  const parts: GeminiMediaPart[] = [];

  for (const message of messages) {
    const metadata = message.mediaMetadata as
      | { mimeType?: string; contentBase64?: string; mediaType?: string; secureUrl?: string }
      | undefined;
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

    const mediaUrl = message.media ?? metadata?.secureUrl;
    if (!mediaUrl) continue;

    if (isPdf || isImage) {
      if (metadata?.contentBase64) {
        parts.push({
          mimeType: isPdf ? 'application/pdf' : metadata.mimeType ?? 'image/jpeg',
          inlineData: metadata.contentBase64,
        });
        continue;
      }

      const publicId = (metadata as { publicId?: string } | undefined)?.publicId;
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

export const buildEvidenceItems = (
  messages: EventReportSessionMessage[],
): Array<{
  type: 'image' | 'pdf' | 'document';
  label: string;
  url: string;
  mimeType?: string;
  fileName?: string;
  sourceMessageIndex: number;
}> => {
  const evidence: Array<{
    type: 'image' | 'pdf' | 'document';
    label: string;
    url: string;
    mimeType?: string;
    fileName?: string;
    sourceMessageIndex: number;
  }> = [];

  messages.forEach((message, index) => {
    const url = message.media ?? (message.mediaMetadata as { secureUrl?: string } | undefined)?.secureUrl;
    if (!url) return;

    const metadata = message.mediaMetadata as
      | { mimeType?: string; mediaType?: string; fileName?: string }
      | undefined;
    const mimeType = metadata?.mimeType ?? '';
    const isPdf = mimeType === 'application/pdf' || metadata?.mediaType === 'pdf';
    const isImage = mimeType.startsWith('image/') || metadata?.mediaType === 'image';
    const type = isPdf ? 'pdf' : isImage ? 'image' : 'document';
    const labelPrefix = isPdf ? 'PDF' : isImage ? 'Image' : 'Document';

    evidence.push({
      type,
      label: `${labelPrefix} ${evidence.filter((item) => item.type === type).length + 1}`,
      url,
      mimeType: metadata?.mimeType,
      fileName: metadata?.fileName,
      sourceMessageIndex: index,
    });
  });

  return evidence;
};
