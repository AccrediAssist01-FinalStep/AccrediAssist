import { DetectedWhatsAppMedia, WhatsAppIncomingMessage, WhatsAppMediaMetadata } from './types';

type WAMessage = import('@whiskeysockets/baileys').proto.IWebMessageInfo;

export interface BaileysMessageUtils {
  extractMessageContent: (message: NonNullable<WAMessage['message']>) => Record<string, unknown> | null | undefined;
  getContentType: (content: Record<string, unknown> | null | undefined) => string | undefined;
}

export interface StandardMessageInput {
  groupName: string;
  sender: string;
  text: string;
  timestamp: Date;
  media?: string | null;
  mediaMetadata?: WhatsAppMediaMetadata | null;
}

export interface WhatsAppIncomingMessageJson {
  groupName: string;
  sender: string;
  message: string;
  timestamp: string;
  media: string | null;
  mediaMetadata?: WhatsAppMediaMetadata | null;
}

export const extractTextFromMessage = (
  message: WAMessage,
  utils: BaileysMessageUtils,
): string | null => {
  if (!message.message) {
    return null;
  }

  const content = utils.extractMessageContent(message.message);
  const contentType = utils.getContentType(content);

  if (contentType === 'conversation') {
    const text = (content as { conversation?: string } | null | undefined)?.conversation?.trim();
    return text || null;
  }

  if (contentType === 'extendedTextMessage') {
    const text = (content as { extendedTextMessage?: { text?: string } } | null | undefined)
      ?.extendedTextMessage?.text?.trim();
    return text || null;
  }

  return null;
};

export const extractMediaCaption = (
  message: WAMessage,
  utils: BaileysMessageUtils,
): string | null => {
  if (!message.message) {
    return null;
  }

  const content = utils.extractMessageContent(message.message);
  const contentType = utils.getContentType(content);

  if (contentType === 'imageMessage') {
    const caption = (content as { imageMessage?: { caption?: string } } | null | undefined)
      ?.imageMessage?.caption?.trim();
    return caption || null;
  }

  if (contentType === 'documentMessage') {
    const caption = (content as { documentMessage?: { caption?: string } } | null | undefined)
      ?.documentMessage?.caption?.trim();
    return caption || null;
  }

  return null;
};

export const detectSupportedMedia = (
  message: WAMessage,
  utils: BaileysMessageUtils,
): DetectedWhatsAppMedia | null => {
  if (!message.message) {
    return null;
  }

  const content = utils.extractMessageContent(message.message);
  const contentType = utils.getContentType(content);

  if (contentType === 'imageMessage') {
    const imageMessage = (content as { imageMessage?: { mimetype?: string; caption?: string } })
      ?.imageMessage;

    if (!imageMessage?.mimetype) {
      return null;
    }

    return {
      mediaType: 'image',
      mimeType: imageMessage.mimetype,
      fileName: buildMediaFileName('image', imageMessage.mimetype),
      caption: imageMessage.caption?.trim() ?? '',
    };
  }

  if (contentType === 'documentMessage') {
    const documentMessage = (content as {
      documentMessage?: { mimetype?: string; fileName?: string; caption?: string };
    })?.documentMessage;

    if (!documentMessage?.mimetype) {
      return null;
    }

    const mediaType = documentMessage.mimetype.toLowerCase() === 'application/pdf' ? 'pdf' : 'document';

    return {
      mediaType,
      mimeType: documentMessage.mimetype,
      fileName: documentMessage.fileName?.trim() || buildMediaFileName(mediaType, documentMessage.mimetype),
      caption: documentMessage.caption?.trim() ?? '',
    };
  }

  return null;
};

export const toStandardMessage = (input: StandardMessageInput): WhatsAppIncomingMessage => ({
  groupName: input.groupName,
  sender: input.sender,
  message: input.text,
  timestamp: input.timestamp,
  media: input.media ?? null,
  mediaMetadata: input.mediaMetadata ?? null,
});

export const toStandardMessageJson = (
  message: WhatsAppIncomingMessage,
): WhatsAppIncomingMessageJson => ({
  groupName: message.groupName,
  sender: message.sender,
  message: message.message,
  timestamp: message.timestamp.toISOString(),
  media: message.media,
  mediaMetadata: message.mediaMetadata ?? null,
});

export const resolveMessageTimestamp = (message: WAMessage): Date => {
  const rawTimestamp = message.messageTimestamp;

  if (typeof rawTimestamp === 'number') {
    return new Date(rawTimestamp * 1000);
  }

  if (typeof rawTimestamp === 'object' && rawTimestamp !== null && 'toNumber' in rawTimestamp) {
    return new Date((rawTimestamp as { toNumber: () => number }).toNumber() * 1000);
  }

  return new Date();
};

export const resolveSenderLabel = (message: WAMessage): string => {
  const pushName = message.pushName?.trim();
  if (pushName) {
    return pushName;
  }

  const participant = message.key.participant ?? message.key.remoteJid ?? 'Unknown Sender';
  return participant.split('@')[0] ?? participant;
};

export const createTestMessageUtils = (): BaileysMessageUtils => ({
  extractMessageContent: (message) => message as Record<string, unknown>,
  getContentType: (content) => {
    if (!content) {
      return undefined;
    }

    if ('conversation' in content) {
      return 'conversation';
    }

    if ('extendedTextMessage' in content) {
      return 'extendedTextMessage';
    }

    if ('imageMessage' in content) {
      return 'imageMessage';
    }

    if ('documentMessage' in content) {
      return 'documentMessage';
    }

    return undefined;
  },
});

const buildMediaFileName = (mediaType: string, mimeType: string): string => {
  if (mimeType.toLowerCase() === 'application/pdf') {
    return 'document.pdf';
  }

  if (mediaType === 'image') {
    return 'image.jpg';
  }

  return 'document.bin';
};
