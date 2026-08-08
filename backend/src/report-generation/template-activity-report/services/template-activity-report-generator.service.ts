import fs from 'fs/promises';
import path from 'path';
import { ReportPipelineContext } from '../../interfaces/report-data.interface';
import { getDocxInstitutionConfig } from '../../docx/config/docx.config';
import { getPdfInstitutionConfig } from '../../pdf/config/pdf.config';
import { buildTemplateActivityReportDocx } from '../builders/template-activity-report-docx.builder';
import { buildTemplateActivityReportPdf } from '../builders/template-activity-report-pdf.builder';
import type {
  TemplateActivityReportContent,
  TemplateActivityReportExportResult,
  TemplateReportConfig,
} from '../template-activity-report.types';
import { generateTemplateActivityNarrative } from './template-activity-narrative.service';
import { logger } from '../../../utils/logger';
import { BadRequestError } from '../../../utils/errors';

const sanitizeFileName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').slice(0, 80);

export class TemplateActivityReportGeneratorService {
  constructor(
    private readonly config: TemplateReportConfig,
    private readonly buildModules: (
      context: ReportPipelineContext,
    ) => Promise<TemplateActivityReportContent['modules']> | TemplateActivityReportContent['modules'],
  ) {}

  async buildContent(context: ReportPipelineContext): Promise<TemplateActivityReportContent> {
    const aggregation = context.collectedData?.aggregation;
    if (!aggregation) {
      throw new BadRequestError(`No aggregated data available for ${this.config.reportTitle}`);
    }

    const institutionPdf = getPdfInstitutionConfig();
    const department = context.filters.department ?? institutionPdf.departmentName ?? 'All Departments';
    const academicYear =
      context.filters.academicYear ??
      (context.filters.year ? String(context.filters.year) : new Date().getFullYear().toString());

    const modules = await this.buildModules(context);
    const narrative = await generateTemplateActivityNarrative(
      this.config.narrative,
      aggregation,
      modules,
      { academicYear, department },
    );

    const totalRecords = modules.reduce((sum, module) => sum + module.rows.length, 0);

    return {
      reportTitle: this.config.reportTitle,
      department,
      academicYear,
      tableHeaders: this.config.tableHeaders,
      columnWeights: this.config.columnWeights,
      introduction: narrative.introduction,
      conclusion: narrative.conclusion,
      modules,
      totalRecords,
      narrativeSource: narrative.source,
    };
  }

  async generateFromPipelineContext(
    context: ReportPipelineContext,
    format: 'pdf' | 'docx',
  ): Promise<TemplateActivityReportExportResult> {
    const content = await this.buildContent(context);
    const input = { content, filters: context.filters, generatedAt: new Date() };
    const baseName = sanitizeFileName(
      `${this.config.fileNamePrefix}-${content.academicYear}-${content.department}`,
    );

    if (format === 'docx') {
      const docxBuffer = await buildTemplateActivityReportDocx(input);
      const institution = getDocxInstitutionConfig();
      await fs.mkdir(institution.exportsDirectory, { recursive: true });
      const docxFileName = `${baseName}-${Date.now()}.docx`;
      const docxFilePath = path.join(institution.exportsDirectory, docxFileName);
      await fs.writeFile(docxFilePath, docxBuffer);

      logger.info(`${this.config.reportTitle} DOCX generated`, {
        fileName: docxFileName,
        totalRecords: content.totalRecords,
      });

      return {
        docxBuffer,
        docxFileName,
        docxFilePath,
        docxUrl: `/api/v1/report-generation/downloads/${encodeURIComponent(docxFileName)}`,
        pdfFileName: `${baseName}.pdf`,
      };
    }

    const pdfBuffer = await buildTemplateActivityReportPdf(input);
    const institution = getPdfInstitutionConfig();
    await fs.mkdir(institution.exportsDirectory, { recursive: true });
    const pdfFileName = `${baseName}-${Date.now()}.pdf`;
    const pdfFilePath = path.join(institution.exportsDirectory, pdfFileName);
    await fs.writeFile(pdfFilePath, pdfBuffer);

    logger.info(`${this.config.reportTitle} PDF generated`, {
      fileName: pdfFileName,
      totalRecords: content.totalRecords,
    });

    return {
      pdfBuffer,
      pdfFileName,
      pdfFilePath,
      pdfUrl: `/api/v1/report-generation/downloads/${encodeURIComponent(pdfFileName)}`,
      docxFileName: `${baseName}.docx`,
    };
  }

  getSectionsIncluded(): string[] {
    return [...this.config.sectionOrder];
  }
}

export const createTemplateActivityReportGenerator = (
  config: TemplateReportConfig,
  buildModules: TemplateActivityReportGeneratorService['buildModules'],
): TemplateActivityReportGeneratorService =>
  new TemplateActivityReportGeneratorService(config, buildModules);
