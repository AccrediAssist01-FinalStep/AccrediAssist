export const VALIDATION_STATUSES = ['valid', 'invalid'] as const;

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export const VALIDATION_ERROR_CODES = [
  'required_field',
  'invalid_date',
  'invalid_company',
  'duplicate_title',
  'missing_information',
] as const;

export type ValidationErrorCode = (typeof VALIDATION_ERROR_CODES)[number];

export interface ValidationIssue {
  code: ValidationErrorCode;
  field: string | null;
  message: string;
}

export interface ValidationResult {
  validationStatus: ValidationStatus;
  validationErrors: ValidationIssue[];
}

export interface ValidationAgentResponse {
  result: ValidationResult;
  model: string;
  provider: 'gemini';
}

export interface ValidationInput {
  category: string;
  extractedData: Record<string, unknown>;
  originalMessage?: string;
  existingTitles?: string[];
}
