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
  WorkshopReportExportResult,
  WorkshopReportGeneratorInput,
  WorkshopReportStructuredContent,
} from '../workshop-report.types';
import { EventMediaItem } from '../../../types/eventReportSession.types';
import { IPendingRecord } from '../../../types/pendingRecord.types';
import { CompletedEventReport } from '../../../models/CompletedEventReport';
import { logger } from '../../../utils/logger';
import { BadRequestError } from '../../../utils/errors';

const sanitizeFileName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').slice(0, 80);

const isWorkshopEventType = (eventType: unknown): boolean => {
  const normalized = String(eventType ?? '').trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return normalized === 'workshop' || normalized.includes('workshop');
};

const pickLatestWorkshopEvent = (context: ReportPipelineContext): Record<string, unknown> | null => {
  const records =
    context.collectedData?.aggregation?.records.byModule.completedEventReports ?? [];

  const workshops = records.filter((record) => isWorkshopEventType(record.eventType));

  if (workshops.length === 0) {
    return null;
  }

  return [...workshops].sort((left, right) => {
    const leftDate = new Date(String(left.date ?? left.createdAt ?? 0)).getTime();
    const rightDate = new Date(String(right.date ?? right.createdAt ?? 0)).getTime();
    return rightDate - leftDate;
  })[0];
};

const loadLatestApprovedWorkshop = async (): Promise<Record<string, unknown> | null> => {
  const latest = await CompletedEventReport.findOne({
    isDeleted: { $ne: true },
    eventType: { $regex: /workshop/i },
  })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  return latest ? (latest as Record<string, unknown>) : null;
};

const hydrateWorkshopEvent = async (
  event: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
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
      return data.workshopReportStructured as WorkshopReportStructuredContent;
    }

    return buildWorkshopReportFromGemini(data as Record<string, unknown>);
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
  ): Promise<WorkshopReportExportResult> {
    const pdfConfig = getPdfInstitutionConfig();
    const docxConfig = getDocxInstitutionConfig();
    await fs.mkdir(pdfConfig.exportsDirectory, { recursive: true });
    await fs.mkdir(docxConfig.exportsDirectory, { recursive: true });

    const input: WorkshopReportGeneratorInput = {
      structured,
      media,
      collegeName: pdfConfig.collegeName,
      defaultDepartment: pdfConfig.departmentName,
      coordinator,
      generatedAt: new Date(),
    };

    const images = await resolveWorkshopImages(input);
    const baseName = sanitizeFileName(
      structured.eventDetails.title ?? structured.reportTitle ?? 'workshop-report',
    );
    const timestamp = Date.now();
    const pdfFileName = `workshop-report-${baseName}-${timestamp}.pdf`;
    const docxFileName = `workshop-report-${baseName}-${timestamp}.docx`;

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

    logger.info('Workshop template report generated', {
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
  ): Promise<WorkshopReportExportResult> {
    const pdfConfig = getPdfInstitutionConfig();
    const structured = buildWorkshopReportFromCompletedEvent(event, pdfConfig.departmentName);
    const media = getMediaFromCompletedEvent(event);
    return this.generateStructuredReport(
      structured,
      media,
      typeof event.coordinator === 'string' ? event.coordinator : undefined,
      format,
    );
  }

  async generateFromPipelineContext(
    context: ReportPipelineContext,
    format: 'docx' | 'pdf',
  ): Promise<WorkshopReportExportResult> {
    let event = pickLatestWorkshopEvent(context);

    if (event) {
      event = await hydrateWorkshopEvent(event);
    } else {
      event = await loadLatestApprovedWorkshop();
      if (event) {
        logger.warn('No workshop matched report filters; using latest approved workshop', {
          reportType: context.reportType,
          filters: context.filters,
          eventTitle: event.eventTitle,
        });
      }
    }

    if (!event) {
      throw new BadRequestError(
        'No approved workshop report found. Approve a WhatsApp workshop in Pending Review first, or clear Academic Year / date filters that may exclude recent workshops.',
      );
    }

    return this.generateFromCompletedEvent(event, format);
  }

  async generateFromPendingRecord(record: IPendingRecord): Promise<WorkshopReportExportResult> {
    const structured = this.buildStructuredFromPendingRecord(record);
    const media = this.getMediaFromPendingRecord(record);
    return this.generateStructuredReport(structured, media, record.senderName, 'both');
  }
}

export const workshopReportGeneratorService = new WorkshopReportGeneratorService();

export { composeWorkshopPreviewText, buildWorkshopReportFromGemini };
