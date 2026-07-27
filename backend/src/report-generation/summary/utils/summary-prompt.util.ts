import fs from 'fs/promises';
import path from 'path';
import { getGenerationReportTypeDefinition } from '../../config/report-types.config';
import type { GenerationReportType } from '../../config/report-types.config';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import { mapDataSourceToModuleKey } from '../../aggregation/config/module-aggregation.config';

const SUMMARY_TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

export const renderSummaryTemplate = (
  template: string,
  variables: Record<string, string>,
): string =>
  template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => variables[key] ?? '');

export const loadExecutiveSummaryTemplates = async (): Promise<{
  system: string;
  userTemplate: string;
}> => {
  const [system, userTemplate] = await Promise.all([
    fs.readFile(path.join(SUMMARY_TEMPLATES_DIR, 'v1.system.txt'), 'utf8'),
    fs.readFile(path.join(SUMMARY_TEMPLATES_DIR, 'v1.user.template.txt'), 'utf8'),
  ]);

  return { system: system.trim(), userTemplate: userTemplate.trim() };
};

/** Compact, deterministic payload for prompt injection — statistics only, no raw documents */
export const buildAggregatedDataPayload = (
  reportType: GenerationReportType,
  aggregation: ReportAggregationResult,
): Record<string, unknown> => {
  const definition = getGenerationReportTypeDefinition(reportType);
  const moduleKeys = definition.dataSources
    .map(mapDataSourceToModuleKey)
    .filter((key): key is NonNullable<typeof key> => key !== null);

  const modules = moduleKeys.map((key) => {
    const stats = aggregation.statistics.byModule[key];
    if (!stats) {
      return { module: key, totalCount: 0, note: 'No data available for this module.' };
    }

    return {
      module: key,
      label: stats.label,
      totalCount: stats.totalCount,
      growthPercentage: stats.growthPercentage,
      previousPeriodCount: stats.previousPeriodCount,
      monthlyTrend: stats.monthlyCount.slice(-12),
      yearlyTrend: stats.yearlyCount,
      departmentBreakdown: stats.departmentWiseCount.slice(0, 10),
      categoryBreakdown: stats.categoryWiseCount.slice(0, 10),
      topPerformers: stats.topPerformers.slice(0, 5),
      latestRecordCount: stats.latestRecords.length,
    };
  });

  return {
    reportType,
    reportLabel: definition.label,
    category: definition.category,
    period: aggregation.metadata.resolvedDateRange,
    filters: aggregation.metadata.filters,
    overall: aggregation.statistics.overall,
    modules,
    institutionalSummary: aggregation.summary,
  };
};

export const buildExecutiveSummaryPrompt = async (
  reportType: GenerationReportType,
  aggregation: ReportAggregationResult,
): Promise<{ systemInstruction: string; prompt: string }> => {
  const definition = getGenerationReportTypeDefinition(reportType);
  const templates = await loadExecutiveSummaryTemplates();
  const payload = buildAggregatedDataPayload(reportType, aggregation);

  const periodLabel =
    aggregation.metadata.resolvedDateRange.label ??
    (aggregation.metadata.resolvedDateRange.start && aggregation.metadata.resolvedDateRange.end
      ? `${aggregation.metadata.resolvedDateRange.start.toISOString().slice(0, 10)} to ${aggregation.metadata.resolvedDateRange.end.toISOString().slice(0, 10)}`
      : 'All available records');

  const variables: Record<string, string> = {
    reportType,
    reportLabel: definition.label,
    reportCategory: definition.category,
    periodLabel,
    aggregatedData: JSON.stringify(payload, null, 2),
  };

  return {
    systemInstruction: renderSummaryTemplate(templates.system, variables),
    prompt: renderSummaryTemplate(templates.userTemplate, variables),
  };
};
