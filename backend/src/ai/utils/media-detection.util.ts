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

/** Run news detection for every WhatsApp image so newspaper clippings without captions are recognized. */
export const shouldRunNewsDetectionForImage = (message: WhatsAppIncomingMessage): boolean =>
  isImageMessage(message);
