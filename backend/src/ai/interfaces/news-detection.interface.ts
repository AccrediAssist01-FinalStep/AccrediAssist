import { NewsArticleCategory } from '../../types/news.types';

export const NON_NEWSPAPER_IMAGE_TYPES = [
  'selfie',
  'event_photo',
  'certificate',
  'offer_letter',
  'poster',
  'screenshot',
  'classroom_image',
  'whatsapp_screenshot',
  'meme',
  'random_image',
  'advertisement',
  'invitation_card',
  'other_non_newspaper',
] as const;

export type NonNewspaperImageType = (typeof NON_NEWSPAPER_IMAGE_TYPES)[number];

export interface NewsDetectionResult {
  isNewspaperArticle: boolean;
  rejectedImageType: NonNewspaperImageType | null;
  headline: string | null;
  articleText: string | null;
  language: string | null;
  newspaperName: string | null;
  publicationDate: string | null;
  peopleMentioned: string[] | null;
  organization: string | null;
  department: string | null;
  articleCategory: NewsArticleCategory | null;
  summary: string | null;
  confidence: number | null;
  reasoning: string | null;
}

export interface NewsDetectionAgentResponse {
  result: NewsDetectionResult;
  model: string;
  provider: 'gemini';
}
