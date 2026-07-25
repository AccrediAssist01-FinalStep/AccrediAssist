export const CLASSIFICATION_CATEGORIES = [
  'Student Achievement',
  'Faculty Achievement',
  'Placement',
  'Internship',
  'Workshop',
  'Seminar',
  'Industrial Visit',
  'Publication',
  'Patent',
  'Other',
] as const;

export type ClassificationCategory = (typeof CLASSIFICATION_CATEGORIES)[number];

export interface ClassificationResult {
  category: ClassificationCategory;
  confidence: number | null;
  reasoning: string | null;
}

export interface ClassificationAgentResponse {
  result: ClassificationResult;
  model: string;
  provider: 'gemini';
}

export interface ClassificationInput {
  extractedData: Record<string, unknown>;
  originalMessage?: string;
}
