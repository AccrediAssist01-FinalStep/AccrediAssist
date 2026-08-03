/**
 * Official workshop report structure derived from Workshop Report.docx reference template.
 * Used for layout/formatting only — content is always AI-generated from WhatsApp evidence.
 */

export const WORKSHOP_REPORT_TYPOGRAPHY = {
  fontFamily: 'Times New Roman',
  departmentSize: 48, // 24pt
  titleSize: 36, // 18pt
  sectionHeadingSize: 28, // 14pt
  bodySize: 24, // 12pt
  lineSpacing: 240,
} as const;

export const WORKSHOP_REPORT_SECTION_ORDER = [
  'cover',
  'eventDetails',
  'introduction',
  'objectives',
  'workshopProceedings',
  'topicsCovered',
  'scheduleSummary',
  'learningOutcomes',
  'keyHighlights',
  'benefits',
  'conclusion',
  'aiExecutiveSummary',
  'acknowledgement',
  'evidenceGallery',
] as const;

export type WorkshopReportSectionId = (typeof WORKSHOP_REPORT_SECTION_ORDER)[number];

/** Section headings matching the reference template hierarchy */
export const WORKSHOP_REPORT_HEADINGS: Record<string, string> = {
  eventDetails: 'Event Details :',
  introduction: 'Introduction',
  objectives: 'Objectives',
  workshopProceedings: 'Workshop Proceedings',
  topicsCovered: 'Topics Covered',
  scheduleSummary: 'Schedule Summary',
  speakerDetails: 'Speaker Details',
  learningOutcomes: 'Learning Outcomes',
  keyHighlights: 'Key Highlights',
  benefits: 'Benefits',
  conclusion: 'Conclusion',
  aiExecutiveSummary: 'AI Executive Summary',
  acknowledgement: 'Acknowledgement',
  evidenceGallery: 'Workshop Photographs',
};

export const WORKSHOP_EVENT_DETAIL_LABELS = {
  title: 'Title of the Event:',
  organizedBy: 'Organized By:',
  resourcePerson: 'Resource Person:',
  headOfDepartment: 'Head of Department:',
  venue: 'Venue:',
  date: 'Date:',
  time: 'Time:',
  participants: 'Participants:',
} as const;

export const UNAVAILABLE_TEXT =
  'Information was not available in the provided WhatsApp conversation or uploaded documents.';

export const getWorkshopReportTitle = (eventTitle: string): string =>
  eventTitle.toLowerCase().startsWith('workshop')
    ? eventTitle
    : `Workshop Report on ${eventTitle}`;
