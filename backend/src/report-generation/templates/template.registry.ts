import { GenerationReportType } from '../config/report-types.config';
import { getGenerationReportTypeDefinition } from '../config/report-types.config';

export interface ReportTemplateDescriptor {
  templateId: string;
  reportType: GenerationReportType;
  version: string;
  promptTemplatePath: string;
  sectionOutline: string[];
}

const SECTION_OUTLINES: Record<GenerationReportType, string[]> = {
  NBA: ['Executive Summary', 'Program Outcomes', 'Placement Metrics', 'Research Output', 'Recommendations'],
  NAAC: ['Executive Summary', 'Criteria Mapping', 'Student Outcomes', 'Faculty Development', 'Recommendations'],
  AICTE: ['Executive Summary', 'Compliance Indicators', 'Infrastructure & Academics', 'Recommendations'],
  Placement: ['Executive Summary', 'Placement Statistics', 'Company Analysis', 'Trends'],
  Internship: ['Executive Summary', 'Internship Statistics', 'Organization Analysis', 'Trends'],
  'Student Achievement': ['Executive Summary', 'Achievement Categories', 'Highlights', 'Trends'],
  'Faculty Achievement': ['Executive Summary', 'Achievement Categories', 'Highlights', 'Trends'],
  Publication: ['Executive Summary', 'Publication Index', 'Journal Breakdown', 'Trends'],
  Patent: ['Executive Summary', 'Patent Status', 'IP Portfolio', 'Trends'],
  'Completed Event': ['Executive Summary', 'Event Summary', 'Participation Metrics', 'Outcomes'],
};

export const getTemplateDescriptor = (reportType: GenerationReportType): ReportTemplateDescriptor => {
  const definition = getGenerationReportTypeDefinition(reportType);
  return {
    templateId: definition.templateId,
    reportType,
    version: 'v1',
    promptTemplatePath: `report-generation/templates/${definition.templateId}.prompt.txt`,
    sectionOutline: SECTION_OUTLINES[reportType],
  };
};

export const listTemplateDescriptors = (
  reportTypes: GenerationReportType[],
): ReportTemplateDescriptor[] => reportTypes.map(getTemplateDescriptor);
