import { z } from 'zod';
import { GENERATION_REPORT_TYPES } from '../config/report-types.config';
import { REPORT_TEMPLATE_SECTION_KEYS } from '../template-system/interfaces/report-template.interface';

export const reportTemplateBrandingSchema = z
  .object({
    collegeLogoPath: z.string().trim().optional(),
    accrediassistLogoPath: z.string().trim().optional(),
    collegeName: z.string().trim().optional(),
    department: z.string().trim().optional(),
    academicYear: z.string().trim().optional(),
    address: z.string().trim().optional(),
    reportTitle: z.string().trim().optional(),
  })
  .optional();

export const reportTemplateOverridesSchema = z
  .object({
    branding: reportTemplateBrandingSchema,
    layout: z
      .object({
        header: z.string().trim().optional(),
        footer: z.string().trim().optional(),
        watermark: z.string().trim().optional(),
        showWatermark: z.boolean().optional(),
      })
      .optional(),
    theme: z
      .object({
        primaryColor: z.string().trim().optional(),
        secondaryColor: z.string().trim().optional(),
        accentColor: z.string().trim().optional(),
        textColor: z.string().trim().optional(),
        fontFamily: z.string().trim().optional(),
        headingFontFamily: z.string().trim().optional(),
        bodyFontSize: z.number().optional(),
        headingFontSize: z.number().optional(),
        subheadingFontSize: z.number().optional(),
        lineSpacing: z.number().optional(),
        marginInches: z.number().optional(),
      })
      .optional(),
    disabledSections: z.array(z.enum(REPORT_TEMPLATE_SECTION_KEYS)).optional(),
    reportTitle: z.string().trim().optional(),
  })
  .optional();

export const reportTemplateResolveSchema = z.object({
  reportType: z.enum(GENERATION_REPORT_TYPES),
  academicYear: z.string().trim().optional(),
  department: z.string().trim().optional(),
  reportTitle: z.string().trim().optional(),
  overrides: reportTemplateOverridesSchema,
});

export const reportGenerationFiltersSchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    academicYear: z.string().trim().optional(),
    department: z.string().trim().optional(),
    month: z.string().trim().optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  )
  .optional();

export const reportGenerationPlanSchema = z.object({
  reportType: z.enum(GENERATION_REPORT_TYPES),
  title: z.string().trim().min(3).max(200).optional(),
  filters: reportGenerationFiltersSchema,
});

export const reportChartsRequestSchema = reportGenerationPlanSchema.extend({
  exportFormat: z.enum(['pdf', 'docx', 'frontend']).optional(),
});

export const reportTypeParamSchema = z.object({
  typeId: z.enum(GENERATION_REPORT_TYPES),
});

export const reportDownloadParamSchema = z.object({
  fileName: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._-]+\.(docx|pdf)$/, 'Invalid report file name'),
});

export type ReportGenerationPlanBody = z.infer<typeof reportGenerationPlanSchema>;
