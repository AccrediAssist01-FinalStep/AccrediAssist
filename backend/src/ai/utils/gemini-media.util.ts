import { ensureCloudinaryConfigured, isCloudinaryConfigured } from '../../config/cloudinary';
import { InternalServerError } from '../../utils/errors';
import { WhatsAppIncomingMessage } from '../../whatsapp/types';
import { GeminiMediaPart } from '../interfaces/ai-response.interface';

const isPdfMessage = (message: WhatsAppIncomingMessage): boolean => {
  const mimeType = message.mediaMetadata?.mimeType?.toLowerCase() ?? '';
  return mimeType === 'application/pdf' || message.mediaMetadata?.mediaType === 'pdf';
};

const fetchBytes = async (url: string): Promise<Buffer | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
};

const downloadPdfBytes = async (message: WhatsAppIncomingMessage): Promise<Buffer> => {
  if (message.mediaMetadata?.contentBase64) {
    return Buffer.from(message.mediaMetadata.contentBase64, 'base64');
  }

  const mediaUrl = message.media ?? message.mediaMetadata?.secureUrl;
  const publicId = message.mediaMetadata?.publicId;

  if (mediaUrl) {
    const direct = await fetchBytes(mediaUrl);
    if (direct && direct.length > 0) {
      return direct;
    }
  }

  if (publicId && isCloudinaryConfigured()) {
    const cloudinary = await ensureCloudinaryConfigured();
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    for (const resourceType of ['raw', 'image'] as const) {
      const format = resourceType === 'raw' ? 'pdf' : 'jpg';
      const privateUrl = cloudinary.utils.private_download_url(publicId, format, {
        resource_type: resourceType,
        type: 'upload',
        expires_at: expiresAt,
      });

      const privateBytes = await fetchBytes(privateUrl);
      if (privateBytes && privateBytes.length > 0) {
        return privateBytes;
      }
    }
  }

  throw new InternalServerError(
    'Unable to download PDF content for Gemini processing. The file may not be publicly accessible.',
  );
};

export const resolveGeminiMediaParts = async (
  message: WhatsAppIncomingMessage,
): Promise<GeminiMediaPart[]> => {
  const mediaUrl = message.media ?? message.mediaMetadata?.secureUrl;
  if (!mediaUrl) {
    return [];
  }

  const mimeType = message.mediaMetadata?.mimeType?.toLowerCase() ?? '';
  const isImage = mimeType.startsWith('image/');
  const isPdf = isPdfMessage(message);

  if (!isImage && !isPdf) {
    return [];
  }

  if (isPdf) {
    const buffer = await downloadPdfBytes(message);
    return [
      {
        mimeType: 'application/pdf',
        inlineData: buffer.toString('base64'),
      },
    ];
  }

  if (message.mediaMetadata?.contentBase64) {
    return [
      {
        mimeType: message.mediaMetadata.mimeType ?? 'image/jpeg',
        inlineData: message.mediaMetadata.contentBase64,
      },
    ];
  }

  return [
    {
      url: mediaUrl,
      mimeType: message.mediaMetadata?.mimeType ?? 'image/jpeg',
    },
  ];
};
