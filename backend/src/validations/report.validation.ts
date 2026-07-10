import { z } from 'zod';
import { REPORT_TYPES } from '../database/enums';
import { paginationSchema } from './common.validation';

export const generateReportSchema = z
  .object({
    reportType: z.enum(REPORT_TYPES, { required_error: 'Report type is required' }),
    month: z.string().trim().optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    academicYear: z.string().trim().optional(),
    department: z.string().trim().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
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
  );

export const reportListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  reportType: z.enum(REPORT_TYPES).optional(),
  generatedBy: z.string().trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z
    .enum(['reportTitle', 'reportType', 'generatedDate', 'createdAt'])
    .default('generatedDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const reportDownloadQuerySchema = z.object({
  redirect: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export type GenerateReportBody = z.infer<typeof generateReportSchema>;
export type ReportListQuery = z.infer<typeof reportListQuerySchema>;
export type ReportDownloadQuery = z.infer<typeof reportDownloadQuerySchema>;
