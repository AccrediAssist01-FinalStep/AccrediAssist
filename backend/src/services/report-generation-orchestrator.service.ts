import {
  dataCollectionService,
  aiSummaryService,
  chartPreparationService,
} from '../report-generation';
import { docxReportService } from '../report-generation/docx/services/docx-report.service';
import { pdfReportService } from '../report-generation/pdf/services/pdf-report.service';
import { GenerationReportType } from '../report-generation/config/report-types.config';
import { ReportGenerationFilters } from '../report-generation/interfaces/report-generation.interface';
import { createPipelineContext } from '../report-generation/utils/report-context.util';
import { ReportExportFormat } from '../database/enums';

export interface GeneratedReportFile {
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  pageCount?: number;
  sectionsIncluded: string[];
}

export class ReportGenerationOrchestrator {
  async generateFile(
    reportType: GenerationReportType,
    filters: ReportGenerationFilters,
    format: ReportExportFormat,
  ): Promise<GeneratedReportFile> {
    let context = createPipelineContext(reportType, filters);
    context = await dataCollectionService.collectForContext(context);
    context = await aiSummaryService.summarizeForContext(context);
    context = await chartPreparationService.prepareForContext(context);

    if (format === 'docx') {
      const result = await docxReportService.generateFromContext(context);
      return {
        fileName: result.fileName,
        filePath: result.filePath,
        fileSizeBytes: result.fileSizeBytes,
        sectionsIncluded: result.sectionsIncluded,
      };
    }

    const result = await pdfReportService.generateFromContext(context);
    return {
      fileName: result.fileName,
      filePath: result.filePath,
      fileSizeBytes: result.fileSizeBytes,
      pageCount: result.pageCount,
      sectionsIncluded: result.sectionsIncluded,
    };
  }
}

export const reportGenerationOrchestrator = new ReportGenerationOrchestrator();
