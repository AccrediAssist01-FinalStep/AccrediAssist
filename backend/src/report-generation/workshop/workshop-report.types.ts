import { EventMediaItem } from '../../types/eventReportSession.types';
import type { EventReportKind } from './utils/event-report-labels.util';

export interface WorkshopEventDetails {
  title: string | null;
  organizedBy: string | null;
  resourcePerson: string | null;
  headOfDepartment: string | null;
  venue: string | null;
  date: string | null;
  time: string | null;
  participants: string | null;
}

export type WorkshopImageSection =
  | 'introduction'
  | 'workshopProceedings'
  | 'speakerDetails'
  | 'studentParticipation'
  | 'evidenceGallery'
  | 'conclusion';

export interface WorkshopImagePlacement {
  imageReference: string;
  section: WorkshopImageSection;
  caption: string;
}

export interface WorkshopReportStructuredContent {
  reportKind?: EventReportKind;
  departmentName: string | null;
  reportTitle: string | null;
  eventDetails: WorkshopEventDetails;
  introduction: string[];
  objectives: string[];
  workshopProceedings: string[];
  speakerDetails: string[];
  scheduleSummary: string[];
  topicsCovered: string[];
  activitiesConducted: string[];
  studentParticipation: string[];
  learningOutcomes: string[];
  keyHighlights: string[];
  benefits: string[];
  conclusion: string[];
  acknowledgement: string[];
  aiExecutiveSummary: string;
  imagePlacements: WorkshopImagePlacement[];
  missingFields: string[];
}

export interface WorkshopReportGeneratorInput {
  structured: WorkshopReportStructuredContent;
  media: EventMediaItem[];
  collegeName: string;
  defaultDepartment: string;
  coordinator?: string;
  generatedAt: Date;
  reportKind: EventReportKind;
}

export interface WorkshopReportExportResult {
  pdfUrl: string;
  docxUrl: string;
  pdfFileName: string;
  docxFileName: string;
  pdfFilePath?: string;
  docxFilePath?: string;
  pdfBuffer?: Buffer;
  docxBuffer?: Buffer;
}

export interface ResolvedWorkshopImage {
  label: string;
  url: string;
  caption: string;
  bytes?: Buffer;
  section: WorkshopImageSection;
}
