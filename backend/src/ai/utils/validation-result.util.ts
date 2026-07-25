import { z } from 'zod';
import { ValidationError } from '../../utils/errors';
import {
  VALIDATION_ERROR_CODES,
  VALIDATION_STATUSES,
  ValidationIssue,
  ValidationResult,
} from '../interfaces/validation.interface';

const nullableString = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().nullable(),
);

const validationIssueSchema = z.object({
  code: z.enum(VALIDATION_ERROR_CODES),
  field: nullableString,
  message: z.string().min(1),
});

export const validationResultSchema = z
  .object({
    validationStatus: z.enum(VALIDATION_STATUSES),
    validationErrors: z.array(validationIssueSchema),
  })
  .superRefine((value, context) => {
    if (value.validationStatus === 'valid' && value.validationErrors.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid status cannot include validation errors',
      });
    }

    if (value.validationStatus === 'invalid' && value.validationErrors.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid status must include at least one validation error',
      });
    }
  });

export const normalizeValidationResult = (payload: unknown): ValidationResult => {
  const parsed = validationResultSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Gemini validation response failed validation', [
      parsed.error.message,
    ]);
  }

  return parsed.data;
};

export const VALIDATION_RESULT_KEYS: Array<keyof ValidationResult> = [
  'validationStatus',
  'validationErrors',
];

export const hasValidationErrorCode = (
  errors: ValidationIssue[],
  code: ValidationIssue['code'],
): boolean => errors.some((error) => error.code === code);
