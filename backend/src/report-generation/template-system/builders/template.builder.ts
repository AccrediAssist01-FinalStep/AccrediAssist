import type {
  ReportTemplateBranding,
  ReportTemplateBuildInput,
  ReportTemplateDefinition,
  ReportTemplateLayout,
  ReportTemplateOverrides,
  ReportTemplateSection,
  ReportTemplateSectionKey,
  ReportTemplateTheme,
  ResolvedReportTemplate,
} from '../interfaces/report-template.interface';
import { getGenerationReportTypeDefinition } from '../../config/report-types.config';
import { buildReportTitle } from '../../utils/report-context.util';
import type { ReportGenerationFilters } from '../../interfaces/report-generation.interface';
import {
  getInstitutionDefaultsFromEnv,
  getReportTemplateDefinition,
} from '../config/template-definitions.config';

const mergeTheme = (
  base: ReportTemplateTheme,
  override?: Partial<ReportTemplateTheme>,
): ReportTemplateTheme => ({
  ...base,
  ...override,
});

const mergeLayout = (
  base: ReportTemplateLayout,
  override?: Partial<ReportTemplateLayout>,
): ReportTemplateLayout => ({
  ...base,
  ...override,
});

const applySectionOverrides = (
  sections: ReportTemplateSection[],
  disabledSections: ReportTemplateSectionKey[] = [],
): ReportTemplateSection[] =>
  sections.map((section) => ({
    ...section,
    enabled: section.enabled && !disabledSections.includes(section.key),
  }));

export class TemplateBuilder {
  build(input: ReportTemplateBuildInput): ResolvedReportTemplate {
    const definition = getReportTemplateDefinition(input.reportType);
    const institution = getInstitutionDefaultsFromEnv();
    const typeDefinition = getGenerationReportTypeDefinition(input.reportType);

    const filters: ReportGenerationFilters = {
      academicYear: input.academicYear,
      department: input.department,
    };

    const reportTitle =
      input.overrides?.reportTitle ??
      input.reportTitle ??
      buildReportTitle(input.reportType, filters, undefined);

    const branding = this.buildBranding(input.overrides, {
      collegeName: institution.collegeName,
      department: input.department ?? institution.department,
      academicYear: input.academicYear ?? 'Not specified',
      address: institution.address,
      collegeLogoPath: institution.collegeLogoPath,
      accrediassistLogoPath: institution.accrediassistLogoPath,
      reportTitle,
    });

    const layout = mergeLayout(definition.defaultLayout, input.overrides?.layout);
    const theme = mergeTheme(definition.theme, input.overrides?.theme);

    const sections = applySectionOverrides(
      definition.sections,
      input.overrides?.disabledSections,
    );

    const enabledSectionKeys = sections
      .filter((section) => section.enabled)
      .sort((a, b) => a.order - b.order)
      .map((section) => section.key);

    return {
      templateId: definition.templateId,
      reportType: input.reportType,
      label: definition.label,
      category: typeDefinition.category,
      version: definition.version,
      description: definition.description,
      branding,
      layout,
      theme,
      sections: sections.sort((a, b) => a.order - b.order),
      enabledSectionKeys,
      generatedAt: new Date(),
    };
  }

  buildFromDefinition(
    definition: ReportTemplateDefinition,
    branding: ReportTemplateBranding,
    overrides?: ReportTemplateOverrides,
  ): ResolvedReportTemplate {
    return this.build({
      reportType: definition.reportType,
      overrides: {
        ...overrides,
        branding,
      },
      academicYear: branding.academicYear,
      department: branding.department,
      reportTitle: branding.reportTitle,
    });
  }

  private buildBranding(
    overrides: ReportTemplateOverrides | undefined,
    defaults: ReportTemplateBranding,
  ): ReportTemplateBranding {
    const brandingOverride = overrides?.branding ?? {};

    return {
      collegeLogoPath: brandingOverride.collegeLogoPath ?? defaults.collegeLogoPath,
      accrediassistLogoPath: brandingOverride.accrediassistLogoPath ?? defaults.accrediassistLogoPath,
      collegeName: brandingOverride.collegeName ?? defaults.collegeName,
      department: brandingOverride.department ?? defaults.department,
      academicYear: brandingOverride.academicYear ?? defaults.academicYear,
      address: brandingOverride.address ?? defaults.address,
      reportTitle: brandingOverride.reportTitle ?? defaults.reportTitle,
    };
  }
}

export const templateBuilder = new TemplateBuilder();
