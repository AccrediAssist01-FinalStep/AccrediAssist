import { GENERATION_REPORT_TYPES } from '../../config/report-types.config';
import type { GenerationReportType } from '../../config/report-types.config';
import type {
  ReportTemplateBuildInput,
  ReportTemplateListItem,
  ReportTemplateOverrides,
  ResolvedReportTemplate,
} from '../interfaces/report-template.interface';
import { templateBuilder, TemplateBuilder } from '../builders/template.builder';
import {
  getReportTemplateDefinition,
  listReportTemplateDefinitions,
} from '../config/template-definitions.config';

export class TemplateService {
  constructor(private readonly builder: TemplateBuilder = templateBuilder) {}

  listTemplates(): ReportTemplateListItem[] {
    return listReportTemplateDefinitions().map((definition) => ({
      templateId: definition.templateId,
      reportType: definition.reportType,
      label: definition.label,
      category: definition.category,
      version: definition.version,
      sectionCount: definition.sections.filter((section) => section.enabled).length,
    }));
  }

  getTemplateDefinition(reportType: GenerationReportType) {
    return getReportTemplateDefinition(reportType);
  }

  resolveTemplate(input: ReportTemplateBuildInput): ResolvedReportTemplate {
    return this.builder.build(input);
  }

  resolveWithOverrides(
    reportType: GenerationReportType,
    overrides?: ReportTemplateOverrides,
    options?: { academicYear?: string; department?: string; reportTitle?: string },
  ): ResolvedReportTemplate {
    return this.builder.build({
      reportType,
      overrides,
      academicYear: options?.academicYear,
      department: options?.department,
      reportTitle: options?.reportTitle,
    });
  }

  validateAllTemplates(): { valid: boolean; reportTypes: GenerationReportType[]; errors: string[] } {
    const errors: string[] = [];

    for (const reportType of GENERATION_REPORT_TYPES) {
      try {
        const resolved = this.resolveTemplate({ reportType });
        if (resolved.sections.length === 0) {
          errors.push(`${reportType}: no sections defined`);
        }
        if (resolved.enabledSectionKeys.length === 0) {
          errors.push(`${reportType}: no enabled sections`);
        }
        if (!resolved.branding.reportTitle) {
          errors.push(`${reportType}: missing report title`);
        }
        if (!resolved.theme.primaryColor) {
          errors.push(`${reportType}: missing theme primary color`);
        }
      } catch (error) {
        errors.push(
          `${reportType}: ${error instanceof Error ? error.message : 'validation failed'}`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      reportTypes: [...GENERATION_REPORT_TYPES],
      errors,
    };
  }
}

export const templateService = new TemplateService();
