import { WhatsAppIncomingMessage } from '../../whatsapp/types';

export type IncomingMediaKind = 'pdf' | 'image' | 'document' | 'text';

export const detectIncomingMediaKind = (message: WhatsAppIncomingMessage): IncomingMediaKind => {
  const mimeType = message.mediaMetadata?.mimeType?.toLowerCase() ?? '';

  if (mimeType === 'application/pdf') {
    return 'pdf';
  }

  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (message.media || message.mediaMetadata?.secureUrl) {
    return 'document';
  }

  return 'text';
};

export const isPdfMessage = (message: WhatsAppIncomingMessage): boolean =>
  detectIncomingMediaKind(message) === 'pdf';

export const isImageMessage = (message: WhatsAppIncomingMessage): boolean =>
  detectIncomingMediaKind(message) === 'image';

const NEWSPAPER_HINT_PATTERN =
  /\b(newspaper|news article|news clipping|epaper|e-paper|headline|published in|times of india|lokmat|sakal|maharashtra times|dainik|pudhari|loksatta)\b/i;

const PLACEHOLDER_IMAGE_CAPTION = /^\[WhatsApp image attachment from/i;

/** Skip the news-detection pass for typical ERP photos to reduce WhatsApp processing time. */
export const shouldRunNewsDetectionForImage = (message: WhatsAppIncomingMessage): boolean => {
  const caption = message.message.trim();

  if (!caption || PLACEHOLDER_IMAGE_CAPTION.test(caption)) {
    return false;
  }

  return NEWSPAPER_HINT_PATTERN.test(caption);
};
