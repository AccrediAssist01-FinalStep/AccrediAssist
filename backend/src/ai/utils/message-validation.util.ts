import { WhatsAppIncomingMessage } from '../../whatsapp/types';

const CASUAL_EXACT = new Set([
  'hi',
  'hello',
  'hey',
  'hii',
  'hiii',
  'thanks',
  'thank you',
  'thankyou',
  'ty',
  'thx',
  'ok',
  'okay',
  'k',
  'kk',
  'yes',
  'no',
  'yep',
  'nope',
  'good morning',
  'good afternoon',
  'good evening',
  'good night',
  'gm',
  'gn',
  'bye',
  'goodbye',
  'see you',
  'see ya',
  'welcome',
  'congrats',
  'done',
  'noted',
  'received',
  'sure',
  'fine',
  'cool',
  'great',
  'nice',
  'wow',
]);

const INSTITUTIONAL_KEYWORDS =
  /\b(placement|placed|internship|intern|achievement|workshop|seminar|publication|published|patent|event|certificate|offer|letter|student|faculty|prof|dr\.|university|college|company|package|lpa|recruited|winner|award|conference|journal|paper|visit|training|hackathon|project|department|accreditation|nba|naac|aicte|circular|brochure|newspaper|magazine|news|report|research|stipend|placed at|selected for)\b/i;

const EMOJI_ONLY_PATTERN = /^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+$/u;

const normalizeText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const isNonInstitutionalMessage = (message: WhatsAppIncomingMessage): boolean => {
  if (message.media || message.mediaMetadata?.secureUrl) {
    return false;
  }

  const text = message.message.trim();
  if (!text) {
    return true;
  }

  if (EMOJI_ONLY_PATTERN.test(text)) {
    return true;
  }

  const normalized = normalizeText(text);

  if (CASUAL_EXACT.has(normalized)) {
    return true;
  }

  if (text.length <= 20 && CASUAL_EXACT.has(normalized)) {
    return true;
  }

  const wordCount = normalized.split(' ').filter(Boolean).length;
  if (wordCount <= 4 && !INSTITUTIONAL_KEYWORDS.test(text)) {
    if (
      CASUAL_EXACT.has(normalized) ||
      /^(hi|hello|hey|thanks|ok|good morning|good evening|good night|bye)\b/.test(normalized)
    ) {
      return true;
    }
  }

  if (wordCount <= 2 && !INSTITUTIONAL_KEYWORDS.test(text) && text.length <= 30) {
    return true;
  }

  return false;
};

export const getMessageValidationReason = (message: WhatsAppIncomingMessage): string | null => {
  if (!isNonInstitutionalMessage(message)) {
    return null;
  }

  const text = message.message.trim();
  if (!text) {
    return 'empty message';
  }

  if (EMOJI_ONLY_PATTERN.test(text)) {
    return 'emoji only';
  }

  return 'casual or non-institutional conversation';
};
