import { z } from 'zod';
import { ValidationError } from '../../utils/errors';
import {
  PDF_DOCUMENT_TYPES,
  PDF_SUGGESTED_CATEGORIES,
  PdfDocumentExtractionResult,
} from '../interfaces/pdf-document.interface';

const nullableString = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().nullable(),
);

const nullableConfidence = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.number().min(0).max(100).nullable(),
);

export const pdfDocumentResultSchema = z.object({
  documentType: z.enum(PDF_DOCUMENT_TYPES),
  extractedText: nullableString,
  summary: nullableString,
  suggestedCategory: z.enum(PDF_SUGGESTED_CATEGORIES),
  studentName: nullableString,
  facultyName: nullableString,
  company: nullableString,
  organization: nullableString,
  eventName: nullableString,
  date: nullableString,
  department: nullableString,
  achievement: nullableString,
  title: nullableString,
  confidence: nullableConfidence,
});

export const normalizePdfDocumentResult = (payload: unknown): PdfDocumentExtractionResult => {
  const parsed = pdfDocumentResultSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Gemini PDF document response failed validation', [
      parsed.error.message,
    ]);
  }

  return parsed.data;
};
