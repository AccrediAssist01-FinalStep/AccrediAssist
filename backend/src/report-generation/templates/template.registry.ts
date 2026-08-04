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
  'Student Activities': [
    'Executive Summary',
    'Summary Statistics',
    'Category-wise Charts',
    'Monthly Activity Charts',
    'Department-wise Charts',
    'Date-wise Activity Register',
    'Sports',
    'Cultural',
    'Technical',
    'Research',
    'Internships',
    'Placements',
    'Certifications',
    'Workshops',
    'Seminars',
    'Industrial Visits',
    'Startup & Innovation',
    'NSS / NCC',
  ],
  'Faculty Activities': [
    'Executive Summary',
    'Category Statistics',
    'Department Charts',
    'Monthly Trends',
    'Publication Statistics',
    'Patent Statistics',
    'Awards Summary',
    'Faculty Development Programs',
    'Workshops',
    'Seminars',
    'Conferences',
    'Publications',
    'Patents',
    'Book Chapters',
    'Consultancy',
    'Sponsored Projects',
    'Certifications',
    'Awards',
    'Guest Lectures',
  ],
  'Department Activities': [
    'Executive Summary',
    'Event Statistics',
    'Monthly Reports',
    'Yearly Reports',
    'Department Growth Charts',
    'Activity Timeline',
    'Recent Activities',
    'Department Events',
    'Industrial Visits',
    'Department Notifications',
    'Department Achievement Repository',
    'Accreditation Activities',
    'Department Achievements',
  ],
  NBA: ['Executive Summary', 'Program Outcomes', 'Placement Metrics', 'Research Output', 'Recommendations'],
  NAAC: ['Executive Summary', 'Criteria Mapping', 'Student Outcomes', 'Faculty Development', 'Recommendations'],
  AICTE: ['Executive Summary', 'Compliance Indicators', 'Infrastructure & Academics', 'Recommendations'],
  'AI Generated Workshop': [
    'Executive Summary',
    'Workshop Statistics',
    'Participation Metrics',
    'Workshop Details',
    'Recommendations',
  ],
  'AI Generated Industrial Visit': [
    'Executive Summary',
    'Visit Statistics',
    'Participation Metrics',
    'Industrial Visit Details',
    'Recommendations',
  ],
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
