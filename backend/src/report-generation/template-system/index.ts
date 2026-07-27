export { templateService, TemplateService } from './services/template.service';
export { templateBuilder, TemplateBuilder } from './builders/template.builder';
export type {
  ReportTemplateSectionKey,
  ReportTemplateBranding,
  ReportTemplateLayout,
  ReportTemplateTheme,
  ReportTemplateSection,
  ReportTemplateDefinition,
  ReportTemplateOverrides,
  ReportTemplateBuildInput,
  ResolvedReportTemplate,
  ReportTemplateListItem,
} from './interfaces/report-template.interface';
export {
  REPORT_TEMPLATE_SECTION_KEYS,
} from './interfaces/report-template.interface';
export {
  REPORT_TEMPLATE_DEFINITIONS,
  getReportTemplateDefinition,
  listReportTemplateDefinitions,
  getInstitutionDefaultsFromEnv,
} from './config/template-definitions.config';
export {
  INSTITUTIONAL_THEME,
  DEFAULT_SECTIONS,
  buildDefaultSections,
  DEFAULT_HEADER_TEXT,
  DEFAULT_FOOTER_TEXT,
} from './config/theme.config';
