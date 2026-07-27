import { z } from 'zod';
import { GENERATION_REPORT_TYPES } from '../config/report-types.config';

export const reportGenerationFiltersSchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    academicYear: z.string().trim().optional(),
    department: z.string().trim().optional(),
    month: z.string().trim().optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  })
  .optional();

export const reportGenerationPlanSchema = z.object({
  reportType: z.enum(GENERATION_REPORT_TYPES),
  title: z.string().trim().min(3).max(200).optional(),
  filters: reportGenerationFiltersSchema,
});

export const reportTypeParamSchema = z.object({
  typeId: z.enum(GENERATION_REPORT_TYPES),
});

export type ReportGenerationPlanBody = z.infer<typeof reportGenerationPlanSchema>;
