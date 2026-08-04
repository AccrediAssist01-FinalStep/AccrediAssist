import fs from 'fs/promises';
import path from 'path';
import { ReportPipelineContext } from '../../interfaces/report-data.interface';
import { getDocxInstitutionConfig } from '../../docx/config/docx.config';
import { getPdfInstitutionConfig } from '../../pdf/config/pdf.config';
import { buildWorkshopReportDocx } from '../builders/workshop-report-docx.builder';
import { buildWorkshopReportPdf } from '../builders/workshop-report-pdf.builder';
import { resolveWorkshopImages } from '../utils/workshop-report-images.util';
import {
  buildWorkshopReportFromCompletedEvent,
  buildWorkshopReportFromGemini,
  composeWorkshopPreviewText,
  getMediaFromCompletedEvent,
} from '../utils/workshop-report-normalizer.util';
import {
  EventReportKind,
  getEventReportLabels,
  resolveEventReportKind,
  resolveEventReportKindFromCategory,
} from '../utils/event-report-labels.util';
import {
  WorkshopReportExportResult,
  WorkshopReportGeneratorInput,
  WorkshopReportStructuredContent,
} from '../workshop-report.types';
import { EventMediaItem } from '../../../types/eventReportSession.types';
import { IPendingRecord } from '../../../types/pendingRecord.types';
import { CompletedEventReport } from '../../../models/CompletedEventReport';
import { logger } from '../../../utils/logger';
import { BadRequestError } from '../../../utils/errors';
import { GenerationReportType } from '../../config/report-types.config';

const sanitizeFileName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').slice(0, 80);

const resolveKindFromReportType = (reportType: GenerationReportType | string): EventReportKind => {
  if (reportType === 'AI Generated Industrial Visit') {
    return 'industrialVisit';
  }
  return 'workshop';
};

const matchesEventKind = (eventType: unknown, kind: EventReportKind): boolean => {
  const normalized = String(eventType ?? '').trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (kind === 'industrialVisit') {
    return (
      normalized.includes('industrial') ||
      normalized.includes('field visit') ||
      normalized.includes('site visit')
    );
  }

  return normalized.includes('workshop') || normalized.includes('training') || normalized.includes('fdp');
};

const pickLatestEvent = (
  context: ReportPipelineContext,
  kind: EventReportKind,
): Record<string, unknown> | null => {
  const records =
    context.collectedData?.aggregation?.records.byModule.completedEventReports ?? [];

  const filtered = records.filter((record) => matchesEventKind(record.eventType, kind));
  if (filtered.length === 0) {
    return null;
  }

  return [...filtered].sort((left, right) => {
    const leftDate = new Date(String(left.date ?? left.createdAt ?? 0)).getTime();
    const rightDate = new Date(String(right.date ?? right.createdAt ?? 0)).getTime();
    return rightDate - leftDate;
  })[0];
};

const loadLatestApprovedEvent = async (kind: EventReportKind): Promise<Record<string, unknown> | null> => {
  const query =
    kind === 'industrialVisit'
      ? { isDeleted: { $ne: true }, eventType: { $regex: /industrial|field visit|site visit/i } }
      : { isDeleted: { $ne: true }, eventType: { $regex: /workshop|training|fdp/i } };

  const latest = await CompletedEventReport.findOne(query).sort({ date: -1, createdAt: -1 }).lean();
  return latest ? (latest as Record<string, unknown>) : null;
};

const hydrateEvent = async (event: Record<string, unknown>): Promise<Record<string, unknown>> => {
  const eventId = event._id;
  if (!eventId) {
    return event;
  }

  const fullRecord = await CompletedEventReport.findById(eventId).lean();
  return fullRecord ? (fullRecord as Record<string, unknown>) : event;
};

export class WorkshopReportGeneratorService {
  buildStructuredFromPendingRecord(record: IPendingRecord): WorkshopReportStructuredContent {
    const data = record.extractedData ?? {};

    if (data.workshopReportStructured && typeof data.workshopReportStructured === 'object') {
      const structured = data.workshopReportStructured as WorkshopReportStructuredContent;
      if (!structured.reportKind) {
        structured.reportKind = resolveEventReportKindFromCategory(record.category);
      }
      return structured;
    }

    return buildWorkshopReportFromGemini({
      ...(data as Record<string, unknown>),
      reportType: data.reportType ?? record.category,
      category: record.category,
    });
  }

  getMediaFromPendingRecord(record: IPendingRecord): EventMediaItem[] {
    const data = record.extractedData ?? {};
    if (Array.isArray(data.media)) {
      return data.media as EventMediaItem[];
    }
    return [];
  }

  async generateStructuredReport(
    structured: WorkshopReportStructuredContent,
    media: EventMediaItem[],
    coordinator?: string,
    format: 'docx' | 'pdf' | 'both' = 'both',
    reportKind: EventReportKind = structured.reportKind ?? 'workshop',
  ): Promise<WorkshopReportExportResult> {
    const pdfConfig = getPdfInstitutionConfig();
    const docxConfig = getDocxInstitutionConfig();
    await fs.mkdir(pdfConfig.exportsDirectory, { recursive: true });
    await fs.mkdir(docxConfig.exportsDirectory, { recursive: true });

    const labels = getEventReportLabels(reportKind);
    const input: WorkshopReportGeneratorInput = {
      structured: { ...structured, reportKind },
      media,
      collegeName: pdfConfig.collegeName,
      defaultDepartment: pdfConfig.departmentName,
      coordinator,
      generatedAt: new Date(),
      reportKind,
    };

    const images = await resolveWorkshopImages(input);
    const baseName = sanitizeFileName(
      structured.eventDetails.title ?? structured.reportTitle ?? labels.filePrefix,
    );
    const timestamp = Date.now();
    const pdfFileName = `${labels.filePrefix}-${baseName}-${timestamp}.pdf`;
    const docxFileName = `${labels.filePrefix}-${baseName}-${timestamp}.docx`;

    let pdfBuffer: Buffer | undefined;
    let docxBuffer: Buffer | undefined;

    if (format === 'pdf' || format === 'both') {
      pdfBuffer = await buildWorkshopReportPdf(input, images);
      const pdfFilePath = path.join(pdfConfig.exportsDirectory, pdfFileName);
      await fs.writeFile(pdfFilePath, pdfBuffer);
    }

    if (format === 'docx' || format === 'both') {
      docxBuffer = await buildWorkshopReportDocx(input, images);
      const docxFilePath = path.join(docxConfig.exportsDirectory, docxFileName);
      await fs.writeFile(docxFilePath, docxBuffer);
    }

    const pdfFilePath =
      pdfBuffer !== undefined ? path.join(pdfConfig.exportsDirectory, pdfFileName) : undefined;
    const docxFilePath =
      docxBuffer !== undefined ? path.join(docxConfig.exportsDirectory, docxFileName) : undefined;

    logger.info('Event template report generated', {
      reportKind,
      pdfFileName: pdfBuffer ? pdfFileName : undefined,
      docxFileName: docxBuffer ? docxFileName : undefined,
      imageCount: images.length,
    });

    return {
      pdfUrl: `/api/v1/report-generation/downloads/${encodeURIComponent(pdfFileName)}`,
      docxUrl: `/api/v1/report-generation/downloads/${encodeURIComponent(docxFileName)}`,
      pdfFileName,
      docxFileName,
      pdfFilePath,
      docxFilePath,
      pdfBuffer,
      docxBuffer,
    };
  }

  async generateFromCompletedEvent(
    event: Record<string, unknown>,
    format: 'docx' | 'pdf' | 'both' = 'both',
    reportKind?: EventReportKind,
  ): Promise<WorkshopReportExportResult> {
    const pdfConfig = getPdfInstitutionConfig();
    const structured = buildWorkshopReportFromCompletedEvent(event, pdfConfig.departmentName);
    const kind = reportKind ?? structured.reportKind ?? resolveEventReportKind(event.eventType);
    const media = getMediaFromCompletedEvent(event);
    return this.generateStructuredReport(
      structured,
      media,
      typeof event.coordinator === 'string' ? event.coordinator : undefined,
      format,
      kind,
    );
  }

  async generateFromPipelineContext(
    context: ReportPipelineContext,
    format: 'docx' | 'pdf',
  ): Promise<WorkshopReportExportResult> {
    const kind = resolveKindFromReportType(context.reportType);
    let event = pickLatestEvent(context, kind);

    if (event) {
      event = await hydrateEvent(event);
    } else {
      event = await loadLatestApprovedEvent(kind);
      if (event) {
        logger.warn('No event matched report filters; using latest approved record', {
          reportType: context.reportType,
          reportKind: kind,
          filters: context.filters,
          eventTitle: event.eventTitle,
        });
      }
    }

    if (!event) {
      const label = kind === 'industrialVisit' ? 'industrial visit' : 'workshop';
      throw new BadRequestError(
        `No approved ${label} report found. Approve a WhatsApp ${label} in Pending Review first, or clear Academic Year / date filters that may exclude recent events.`,
      );
    }

    return this.generateFromCompletedEvent(event, format, kind);
  }

  async generateFromPendingRecord(record: IPendingRecord): Promise<WorkshopReportExportResult> {
    const structured = this.buildStructuredFromPendingRecord(record);
    const media = this.getMediaFromPendingRecord(record);
    const reportKind = structured.reportKind ?? resolveEventReportKindFromCategory(record.category);
    return this.generateStructuredReport(structured, media, record.senderName, 'both', reportKind);
  }
}

export const workshopReportGeneratorService = new WorkshopReportGeneratorService();

export { composeWorkshopPreviewText, buildWorkshopReportFromGemini };
