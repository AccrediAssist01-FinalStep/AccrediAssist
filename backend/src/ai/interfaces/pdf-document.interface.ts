export const PDF_DOCUMENT_TYPES = [
  'Placement Offer Letter',
  'Internship Offer Letter',
  'Student Certificate',
  'Faculty Certificate',
  'Publication',
  'Patent',
  'Event Brochure',
  'Accreditation Document',
  'Circular',
  'Seminar Brochure',
  'Workshop Brochure',
  'Industrial Visit Document',
  'Other',
] as const;

export type PdfDocumentType = (typeof PDF_DOCUMENT_TYPES)[number];

export const PDF_SUGGESTED_CATEGORIES = [
  'Student Activity',
  'Faculty Activity',
  'Placement',
  'Internship',
  'Publication',
  'Patent',
  'Event Report',
  'Department Activity',
] as const;

export type PdfSuggestedCategory = (typeof PDF_SUGGESTED_CATEGORIES)[number];

export interface PdfDocumentExtractionResult {
  documentType: PdfDocumentType;
  extractedText: string | null;
  summary: string | null;
  suggestedCategory: PdfSuggestedCategory;
  studentName: string | null;
  facultyName: string | null;
  company: string | null;
  organization: string | null;
  eventName: string | null;
  date: string | null;
  department: string | null;
  achievement: string | null;
  title: string | null;
  confidence: number | null;
}

export interface PdfDocumentAgentResponse {
  result: PdfDocumentExtractionResult;
  model: string;
  provider: 'gemini';
}
