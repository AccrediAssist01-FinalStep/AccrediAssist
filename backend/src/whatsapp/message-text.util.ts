import { WhatsAppIncomingMessage } from './types';

export const buildMediaOnlyPlaceholder = (input: {
  mediaType?: string;
  sender?: string;
}): string => {
  const label = input.mediaType ?? 'media';
  const senderSuffix = input.sender ? ` from ${input.sender}` : '';
  return `[WhatsApp ${label} attachment${senderSuffix}]`;
};

export const resolveIncomingMessageText = (input: {
  message: string;
  media?: string | null;
  mediaMetadata?: WhatsAppIncomingMessage['mediaMetadata'];
  sender?: string;
}): string => {
  const trimmed = input.message.trim();
  if (trimmed) {
    return trimmed;
  }

  const caption = input.mediaMetadata?.caption?.trim();
  if (caption) {
    return caption;
  }

  if (input.media) {
    return buildMediaOnlyPlaceholder({
      mediaType: input.mediaMetadata?.mediaType,
      sender: input.sender,
    });
  }

  return '';
};
