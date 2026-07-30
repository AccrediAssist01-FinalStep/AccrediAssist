import {
  GENERATION_REPORT_TYPES,
  GenerationReportType,
  LEGACY_GENERATION_REPORT_TYPES,
  LegacyGenerationReportType,
} from '../config/report-types.config';
import { BadRequestError } from '../../utils/errors';

const LEGACY_TO_PRIMARY_MAP: Record<LegacyGenerationReportType, GenerationReportType> = {
  Placement: 'Student Activities',
  Internship: 'Student Activities',
  'Student Achievement': 'Student Activities',
  'Faculty Achievement': 'Faculty Activities',
  Publication: 'Faculty Activities',
  Patent: 'Faculty Activities',
  'Completed Event': 'Department Activities',
  News: 'Department Activities',
};

export const isGenerationReportType = (value: string): value is GenerationReportType =>
  (GENERATION_REPORT_TYPES as readonly string[]).includes(value);

export const isLegacyGenerationReportType = (
  value: string,
): value is LegacyGenerationReportType =>
  (LEGACY_GENERATION_REPORT_TYPES as readonly string[]).includes(value);

export const normalizeGenerationReportType = (value: string): GenerationReportType => {
  if (isGenerationReportType(value)) {
    return value;
  }

  if (isLegacyGenerationReportType(value)) {
    return LEGACY_TO_PRIMARY_MAP[value];
  }

  throw new BadRequestError(
    `Invalid report type. Supported types: ${GENERATION_REPORT_TYPES.join(', ')}`,
  );
};

export const parseGenerationReportType = (value: string): GenerationReportType =>
  normalizeGenerationReportType(value);

export const buildDefaultReportTitle = (reportType: GenerationReportType): string =>
  `${reportType} Report`;

export const slugifyReportType = (reportType: GenerationReportType): string =>
  reportType.toLowerCase().replace(/\s+/g, '-');

export const getLegacyReportTypeMapping = (): Record<
  LegacyGenerationReportType,
  GenerationReportType
> => ({ ...LEGACY_TO_PRIMARY_MAP });
