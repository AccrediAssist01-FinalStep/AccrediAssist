export { reportGenerationService, ReportGenerationService } from './services/report-generation.service';
export { dataCollectionService, DataCollectionService } from './services/data-collection.service';
export { aiSummaryService, AiSummaryService } from './services/ai-summary.service';
export { chartPreparationService, ChartPreparationService } from './services/chart-preparation.service';
export { documentGenerationService, DocumentGenerationService } from './services/document-generation.service';
export { exportService, ExportService } from './services/export.service';

export { BaseReportGenerator } from './generators/base-report.generator';
export {
  getReportGenerator,
  getReportGeneratorById,
  listReportGenerators,
} from './generators/generator.registry';

export {
  GENERATION_REPORT_TYPES,
  REPORT_TYPE_DEFINITIONS,
  listGenerationReportTypes,
  getGenerationReportTypeDefinition,
} from './config/report-types.config';
export type { GenerationReportType } from './config/report-types.config';

export type {
  ReportGenerationFilters,
  ReportGenerationModuleStatus,
  ReportGenerationPlan,
  ReportGenerationRequest,
  ReportTypeDefinition,
} from './interfaces/report-generation.interface';
export type {
  CollectedReportData,
  ReportPipelineContext,
  ReportDocumentDraft,
  PreparedChart,
} from './interfaces/report-data.interface';
export type { ReportExportRequest, ReportExportResult } from './interfaces/export.interface';

export { getTemplateDescriptor, listTemplateDescriptors } from './templates/template.registry';

export {
  aggregationService,
  AggregationService,
  AGGREGATION_MODULE_KEYS,
  type AggregationFilters,
  type ReportAggregationResult,
} from './aggregation';

export {
  executiveSummaryService,
  ExecutiveSummaryService,
  type ValidatedExecutiveSummary,
  type ExecutiveSummaryResponse,
} from './summary';

export {
  chartService,
  ChartService,
  chartFactory,
  CHART_DEFINITION_IDS,
  type StandardChart,
  type ChartDefinitionId,
} from './charts';

export {
  docxReportService,
  DocxReportService,
  type DocxGenerationResult,
} from './docx';

export {
  pdfReportService,
  PdfReportService,
  type PdfGenerationResult,
} from './pdf';

export { default as reportGenerationRouter } from './routes/report-generation.routes';
