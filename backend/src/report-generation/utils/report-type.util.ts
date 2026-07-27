import { GENERATION_REPORT_TYPES, GenerationReportType } from '../config/report-types.config';
import { BadRequestError } from '../../utils/errors';

export const isGenerationReportType = (value: string): value is GenerationReportType =>
  (GENERATION_REPORT_TYPES as readonly string[]).includes(value);

export const parseGenerationReportType = (value: string): GenerationReportType => {
  if (!isGenerationReportType(value)) {
    throw new BadRequestError(
      `Invalid report type. Supported types: ${GENERATION_REPORT_TYPES.join(', ')}`,
    );
  }
  return value;
};

export const buildDefaultReportTitle = (reportType: GenerationReportType): string =>
  `${reportType} Report`;

export const slugifyReportType = (reportType: GenerationReportType): string =>
  reportType.toLowerCase().replace(/\s+/g, '-');
