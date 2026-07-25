import { z } from 'zod';
import { ACHIEVEMENT_TYPES, EVENT_TYPES, RECORD_CATEGORIES } from '../database/enums';

const nullableString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional();

const nullableStringArray = z
  .array(z.string().trim().min(1).max(100))
  .max(50)
  .nullable()
  .optional();

export const extractedDataFieldsSchema = z
  .object({
    title: nullableString(300),
    description: nullableString(2000),
    categoryHint: nullableString(100),
    studentNames: nullableStringArray,
    studentName: nullableString(100),
    facultyNames: nullableStringArray,
    facultyName: nullableString(100),
    company: nullableString(200),
    organization: nullableString(200),
    eventName: nullableString(300),
    eventType: z.enum(EVENT_TYPES).nullable().optional(),
    achievementType: z.enum(ACHIEVEMENT_TYPES).nullable().optional(),
    publicationTitle: nullableString(500),
    patentTitle: nullableString(500),
    internship: nullableString(200),
    placement: nullableString(200),
    certificates: z.array(z.string().trim().url('Certificate URL must be valid')).max(20).nullable().optional(),
    mediaReferences: z.array(z.string().trim().min(1).max(500)).max(20).nullable().optional(),
    date: nullableString(50),
    location: nullableString(200),
    confidence: z.number().min(0).max(100).nullable().optional(),
  })
  .strict();

export const editPendingRecordSchema = z
  .object({
    extractedData: extractedDataFieldsSchema.optional(),
    confidenceScore: z.number().min(0).max(100).optional(),
    category: z.enum(RECORD_CATEGORIES).optional(),
  })
  .refine(
    (value) =>
      value.extractedData !== undefined ||
      value.confidenceScore !== undefined ||
      value.category !== undefined,
    {
      message: 'At least one editable field must be provided',
    },
  );

export type ExtractedDataFields = z.infer<typeof extractedDataFieldsSchema>;
export type EditPendingRecordBody = z.infer<typeof editPendingRecordSchema>;
