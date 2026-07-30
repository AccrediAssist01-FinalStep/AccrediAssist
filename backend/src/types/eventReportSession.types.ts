import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';

export type EventReportSessionStatus = 'collecting' | 'processing' | 'completed' | 'failed';

export interface EventReportSessionMessage {
  text: string;
  sender: string;
  media?: string;
  mediaMetadata?: Record<string, unknown> | null;
  receivedAt: Date;
}

export interface IEventReportSession extends IBaseDocument {
  groupName: string;
  messages: EventReportSessionMessage[];
  status: EventReportSessionStatus;
  pendingRecordId?: Types.ObjectId;
  lastMessageAt: Date;
  processedAt?: Date;
  errorMessage?: string;
}

export interface AiEventReportEvidenceItem {
  type: 'image' | 'pdf' | 'document';
  label: string;
  url: string;
  mimeType?: string;
  fileName?: string;
  observation?: string;
  sourceMessageIndex?: number;
}

export interface AiEventReportResult {
  reportType: string;
  title: string | null;
  date: string | null;
  time: string | null;
  venue: string | null;
  department: string | null;
  coordinator: string | null;
  chiefGuest: string | null;
  speaker: string | null;
  organization: string | null;
  participants: number | null;
  objectives: string[];
  activitiesConducted: string[];
  learningOutcomes: string[];
  keyHighlights: string[];
  achievements: string[];
  futureScope: string | null;
  conclusion: string | null;
  summary: string | null;
  keywords: string[];
  missingFields: string[];
  confidenceScore: number;
  aiGeneratedReport: string;
  validationNotes: string;
  imageObservations: Array<{ reference: string; observation: string }>;
  pdfObservations: Array<{ reference: string; observation: string }>;
}
