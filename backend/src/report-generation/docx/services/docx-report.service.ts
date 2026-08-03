import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../../utils/logger';
import type { ReportPipelineContext } from '../../interfaces/report-data.interface';
import { buildReportTitle } from '../../utils/report-context.util';
import { getDocxInstitutionConfig } from '../config/docx.config';
import type { DocxGenerationResult, DocxReportInput } from '../interfaces/docx-report.interface';
import { documentBuilder } from '../builders/document.builder';
import { imageInserter } from '../builders/image.inserter';
import { workshopReportGeneratorService } from '../../workshop/services/workshop-report-generator.service';
import { WORKSHOP_REPORT_SECTION_ORDER } from '../../workshop/workshop-report-template.config';

const sanitizeFileName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').slice(0, 120);

export class DocxReportService {
  async generateFromContext(context: ReportPipelineContext): Promise<DocxGenerationResult> {
    if (context.reportType === 'AI Generated Workshop') {
      const workshop = await workshopReportGeneratorService.generateFromPipelineContext(
        context,
        'docx',
      );

      return {
        buffer: workshop.docxBuffer ?? Buffer.alloc(0),
        fileName: workshop.docxFileName,
        filePath: workshop.docxFilePath ?? '',
        downloadUrl: workshop.docxUrl,
        fileSizeBytes: workshop.docxBuffer?.length ?? 0,
        sectionsIncluded: [...WORKSHOP_REPORT_SECTION_ORDER],
        generatedAt: new Date(),
      };
    }

    const input = this.toReportInput(context);
    return this.generate(input);
  }

  async generate(input: DocxReportInput): Promise<DocxGenerationResult> {
    const institution = getDocxInstitutionConfig();
    await fs.mkdir(institution.exportsDirectory, { recursive: true });

    const eventImages = await imageInserter.prepareImages(input.filters);
    const { buffer, sectionsIncluded } = await documentBuilder.build(input, eventImages);

    const fileName = `${sanitizeFileName(input.reportType)}-${Date.now()}.docx`;
    const filePath = path.join(institution.exportsDirectory, fileName);
    await fs.writeFile(filePath, buffer);

    const downloadUrl = `/api/v1/report-generation/downloads/${encodeURIComponent(fileName)}`;

    logger.info('DOCX report generated', {
      reportType: input.reportType,
      fileName,
      fileSizeBytes: buffer.length,
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
      generatedAt: input.generatedAt,
    };
  }

  resolveExportPath(fileName: string): string {
    const institution = getDocxInstitutionConfig();
    const safeName = path.basename(fileName);
    return path.join(institution.exportsDirectory, safeName);
  }

  private toReportInput(context: ReportPipelineContext): DocxReportInput {
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

export const docxReportService = new DocxReportService();
