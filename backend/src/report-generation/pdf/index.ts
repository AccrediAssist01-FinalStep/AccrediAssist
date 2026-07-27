export { pdfReportService, PdfReportService } from './services/pdf-report.service';
export { pdfBuilder, PdfBuilder } from './builders/pdf.builder';
export { chartRenderer, ChartRenderer } from './renderers/chart.renderer';
export { tableRenderer, TableRenderer } from './renderers/table.renderer';
export { imageRenderer, ImageRenderer } from './renderers/image.renderer';
export { headerFooterService, HeaderFooterService } from './utils/header-footer.util';
export type {
  PdfReportInput,
  PdfGenerationResult,
  PdfInstitutionConfig,
  PdfEventImage,
} from './interfaces/pdf-report.interface';
export {
  getPdfInstitutionConfig,
  PDF_LAYOUT,
  PDF_COLORS,
  PDF_SECTION_ORDER,
} from './config/pdf.config';
