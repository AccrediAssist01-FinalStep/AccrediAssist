export const CLASSIFICATION_CATEGORIES = [
  'Student Achievement',
  'Faculty Achievement',
  'Placement',
  'Internship',
  'Publication',
  'Patent',
  'Completed Event Report',
] as const;

/** @deprecated Legacy categories mapped during normalization */
export const LEGACY_CLASSIFICATION_CATEGORIES = [
  'Workshop',
  'Seminar',
  'Industrial Visit',
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
