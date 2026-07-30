import { RecordCategory } from '../../database/enums';
import { ExtractionResult } from '../interfaces/extraction.interface';
import {
  PdfDocumentExtractionResult,
  PdfSuggestedCategory,
} from '../interfaces/pdf-document.interface';

const PDF_CATEGORY_MAP: Record<PdfSuggestedCategory, RecordCategory> = {
  'Student Activity': 'Student Achievement',
  'Faculty Activity': 'Faculty Achievement',
  Placement: 'Placement',
  Internship: 'Internship',
  Publication: 'Publication',
  Patent: 'Patent',
  'Event Report': 'Workshop',
  'Department Activity': 'Research',
};

const DOCUMENT_TYPE_CATEGORY_MAP: Partial<Record<string, RecordCategory>> = {
  'Placement Offer Letter': 'Placement',
  'Internship Offer Letter': 'Internship',
  'Student Certificate': 'Certification',
  'Faculty Certificate': 'Faculty Achievement',
  Publication: 'Publication',
  Patent: 'Patent',
  'Event Brochure': 'Workshop',
  'Seminar Brochure': 'Seminar',
  'Workshop Brochure': 'Workshop',
  'Industrial Visit Document': 'Industrial Visit',
  Circular: 'Research',
  'Accreditation Document': 'Research',
};

const applyPdfDocumentHints = (
  extraction: ExtractionResult,
  pdfResult: PdfDocumentExtractionResult,
): ExtractionResult => {
  if (pdfResult.documentType === 'Student Certificate') {
    return {
      ...extraction,
      achievementType: 'Certification',
      categoryHint: 'Certification',
    };
  }

  if (pdfResult.documentType === 'Faculty Certificate') {
    return {
      ...extraction,
      achievementType: 'Certification',
      categoryHint: 'Certification',
    };
  }

  return extraction;
};

export const mapPdfCategoryToRecordCategory = (
  pdfResult: PdfDocumentExtractionResult,
): RecordCategory =>
  DOCUMENT_TYPE_CATEGORY_MAP[pdfResult.documentType] ??
  PDF_CATEGORY_MAP[pdfResult.suggestedCategory] ??
  'Research';

export const mergePdfExtractionIntoResult = (
  extraction: ExtractionResult,
  pdfResult: PdfDocumentExtractionResult,
): ExtractionResult =>
  applyPdfDocumentHints(
    {
      ...extraction,
      title: pdfResult.title ?? extraction.title ?? pdfResult.documentType,
      description:
        pdfResult.summary ??
        extraction.description ??
        pdfResult.extractedText?.slice(0, 500) ??
        null,
      categoryHint: pdfResult.suggestedCategory,
      studentNames: pdfResult.studentName
        ? [...new Set([...(extraction.studentNames ?? []), pdfResult.studentName])]
        : extraction.studentNames,
      facultyNames: pdfResult.facultyName
        ? [...new Set([...(extraction.facultyNames ?? []), pdfResult.facultyName])]
        : extraction.facultyNames,
      company: pdfResult.company ?? extraction.company,
      organization: pdfResult.organization ?? extraction.organization,
      eventName: pdfResult.eventName ?? extraction.eventName,
      publicationTitle:
        pdfResult.documentType === 'Publication'
          ? pdfResult.title ?? extraction.publicationTitle
          : extraction.publicationTitle,
      patentTitle:
        pdfResult.documentType === 'Patent'
          ? pdfResult.title ?? extraction.patentTitle
          : extraction.patentTitle,
      date: pdfResult.date ?? extraction.date,
      confidence:
        Math.max(extraction.confidence ?? 0, pdfResult.confidence ?? 0) || extraction.confidence,
    },
    pdfResult,
  );

export const buildPdfPendingExtractedData = (
  pdfResult: PdfDocumentExtractionResult,
  mediaUrl: string | null,
): Record<string, unknown> => ({
  documentType: pdfResult.documentType,
  extractedText: pdfResult.extractedText,
  aiSummary: pdfResult.summary,
  suggestedCategory: pdfResult.suggestedCategory,
  title: pdfResult.title,
  eventName: pdfResult.eventName ?? pdfResult.title,
  date: pdfResult.date,
  organization: pdfResult.organization ?? pdfResult.company,
  studentName: pdfResult.studentName,
  facultyName: pdfResult.facultyName,
  studentNames: pdfResult.studentName ? [pdfResult.studentName] : undefined,
  facultyNames: pdfResult.facultyName ? [pdfResult.facultyName] : undefined,
  achievementType:
    pdfResult.documentType === 'Student Certificate' ||
    pdfResult.documentType === 'Faculty Certificate'
      ? 'Certification'
      : undefined,
  structuredData: {
    studentName: pdfResult.studentName,
    facultyName: pdfResult.facultyName,
    company: pdfResult.company,
    organization: pdfResult.organization,
    eventName: pdfResult.eventName,
    date: pdfResult.date,
    department: pdfResult.department,
    achievement: pdfResult.achievement,
    title: pdfResult.title,
  },
  originalPdfUrl: mediaUrl,
  sourceType: 'pdf',
});
