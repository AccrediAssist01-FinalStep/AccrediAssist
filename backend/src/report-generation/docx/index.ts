export { docxReportService, DocxReportService } from './services/docx-report.service';
export { documentBuilder, DocumentBuilder } from './builders/document.builder';
export { tableBuilder, TableBuilder } from './builders/table.builder';
export { chartInserter, ChartInserter } from './builders/chart.inserter';
export { imageInserter, ImageInserter } from './builders/image.inserter';
export type {
  DocxReportInput,
  DocxGenerationResult,
  DocxInstitutionConfig,
  EventImageAsset,
} from './interfaces/docx-report.interface';
export {
  getDocxInstitutionConfig,
  DOCX_TYPOGRAPHY,
  DOCX_PAGE,
  REPORT_SECTION_ORDER,
} from './config/docx.config';
