import { WhatsAppIncomingMessage } from '../../whatsapp/types';
import { isPdfMessage, isImageMessage } from './media-detection.util';

const EVENT_KEYWORD_PATTERN =
  /\b(workshop|industrial visit|field visit|seminar|conference|guest lecture|training program|hackathon|department event|symposium|webinar|fdp|faculty development|site visit|expert talk)\b/i;

export const getMessageCombinedText = (message: WhatsAppIncomingMessage): string =>
  [message.message, message.mediaMetadata?.caption].filter(Boolean).join('\n').trim();

export const shouldStartEventReportSession = (message: WhatsAppIncomingMessage): boolean => {
  const text = getMessageCombinedText(message);

  if (EVENT_KEYWORD_PATTERN.test(text)) {
    return true;
  }

  if (isPdfMessage(message)) {
    return true;
  }

  if (isImageMessage(message) && text.length > 0 && EVENT_KEYWORD_PATTERN.test(text)) {
    return true;
  }

  return false;
};

export const shouldAppendToEventReportSession = (
  message: WhatsAppIncomingMessage,
  hasActiveSession: boolean,
): boolean => {
  if (hasActiveSession) {
    return true;
  }

  return shouldStartEventReportSession(message);
};

export const mapReportTypeToCategory = (
  reportType: string,
): 'Workshop' | 'Industrial Visit' | 'Seminar' | 'Research' => {
  const normalized = reportType.toLowerCase();

  if (normalized.includes('industrial') || normalized.includes('field visit')) {
    return 'Industrial Visit';
  }

  if (normalized.includes('seminar') || normalized.includes('conference')) {
    return 'Seminar';
  }

  if (normalized.includes('workshop') || normalized.includes('training') || normalized.includes('fdp')) {
    return 'Workshop';
  }

  return 'Workshop';
};
