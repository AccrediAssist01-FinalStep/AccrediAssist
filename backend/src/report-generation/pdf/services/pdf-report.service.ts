import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../../utils/logger';
import type { ReportPipelineContext } from '../../interfaces/report-data.interface';
import { buildReportTitle } from '../../utils/report-context.util';
import { getPdfInstitutionConfig } from '../config/pdf.config';
import type { PdfGenerationResult, PdfReportInput } from '../interfaces/pdf-report.interface';
import { pdfBuilder } from '../builders/pdf.builder';
import { imageRenderer } from '../renderers/image.renderer';

const sanitizeFileName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').slice(0, 120);

export class PdfReportService {
  async generateFromContext(context: ReportPipelineContext): Promise<PdfGenerationResult> {
    return this.generate(this.toReportInput(context));
  }

  async generate(input: PdfReportInput): Promise<PdfGenerationResult> {
    const institution = getPdfInstitutionConfig();
    await fs.mkdir(institution.exportsDirectory, { recursive: true });

    const eventImages = await imageRenderer.prepareImages(input.filters);
    const { buffer, sectionsIncluded, pageCount } = await pdfBuilder.build(input, eventImages);

    const fileName = `${sanitizeFileName(input.reportType)}-${Date.now()}.pdf`;
    const filePath = path.join(institution.exportsDirectory, fileName);
    await fs.writeFile(filePath, buffer);

    const downloadUrl = `/api/v1/report-generation/downloads/${encodeURIComponent(fileName)}`;

    logger.info('PDF report generated', {
      reportType: input.reportType,
      fileName,
      fileSizeBytes: buffer.length,
      pageCount,
      sectionsIncluded,
      imageCount: eventImages.length,
    });

    return {
      buffer,
      fileName,
      filePath,
      downloadUrl,
      fileSizeBytes: buffer.length,
      sectionsIncluded,
      pageCount,
      generatedAt: input.generatedAt,
    };
  }

  resolveExportPath(fileName: string): string {
    const institution = getPdfInstitutionConfig();
    return path.join(institution.exportsDirectory, path.basename(fileName));
  }

  private toReportInput(context: ReportPipelineContext): PdfReportInput {
    return {
      reportType: context.reportType,
      title: buildReportTitle(context.reportType, context.filters, undefined),
      filters: context.filters,
      aiSummary: context.aiSummary,
      charts: context.charts,
      collectedData: context.collectedData,
      generatedAt: new Date(),
    };
  }
}

export const pdfReportService = new PdfReportService();
