import fs from 'fs/promises';
import path from 'path';
import { geminiProvider } from '../../../ai/providers/gemini.provider';
import { isGeminiConfigured } from '../../../ai';
import { logger } from '../../../utils/logger';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import type {
  TemplateModuleTable,
  TemplateNarrativeConfig,
} from '../template-activity-report.types';

const TARGET_WORDS = 200;

const buildModuleSummary = (modules: TemplateModuleTable[]): string =>
  modules.map((module) => `${module.heading}: ${module.rows.length} record(s)`).join('\n');

const buildStatsSummary = (
  aggregation: ReportAggregationResult,
  modules: TemplateModuleTable[],
): string => {
  if (modules.length === 1) {
    return `This report covers only ${modules[0].heading}. Record count for this module: ${modules[0].rows.length}. Do not cite counts from other activity types.`;
  }

  const overall = aggregation.statistics.overall.totalRecords;
  const byModule = Object.entries(aggregation.statistics.byModule)
    .map(([key, stats]) => `${stats?.label ?? key}: ${stats?.totalCount ?? 0}`)
    .join(', ');
  return `Total records: ${overall}. Breakdown: ${byModule}`;
};

export interface TemplateNarrativeResult {
  introduction: string[];
  conclusion: string[];
  source: 'gemini' | 'fallback';
}

export const generateTemplateActivityNarrative = async (
  config: TemplateNarrativeConfig,
  aggregation: ReportAggregationResult,
  modules: TemplateModuleTable[],
  context: { academicYear: string; department: string },
): Promise<TemplateNarrativeResult> => {
  const totalRecords = modules.reduce((sum, module) => sum + module.rows.length, 0);
  const activeModules = modules.filter((module) => module.rows.length > 0).length;

  const buildFallback = (): TemplateNarrativeResult => {
    const introTail = config.introTailoring({
      modules,
      academicYear: context.academicYear,
      department: context.department,
      totalRecords,
      activeModules,
    });

    const introduction =
      modules.length === 1
        ? [
            `This report documents ${modules[0].heading} for ${context.department} during academic year ${context.academicYear}. The contents are drawn from approved records in the institutional repository.`,
            `A total of ${totalRecords} approved record(s) belonging to this module are included. Student names, dates, organizations, awards, and sponsorship amounts appear only when stored in the source records.`,
            introTail.length > 0
              ? introTail
              : 'The following section presents structured details of each record, followed by associated photographs when available.',
          ]
      : introTail.length > 0
        ? [...config.fallbackIntroduction.slice(0, 2), introTail]
        : [...config.fallbackIntroduction];

    const conclusion =
      modules.length === 1
        ? [
            `The ${modules[0].heading} records summarized in this report reflect student participation documented for the selected period.`,
            totalRecords === 0
              ? 'No approved records were available for this module in the selected reporting period. The institution should continue encouraging participation and maintaining systematic documentation as activities are completed.'
              : 'These documented activities support accreditation evidence for this module. Additional interpretation is limited to the counts and titles listed in the tables.',
            'Continued mentoring and systematic record-keeping will help the institution present this module accurately in future accreditation cycles.',
          ]
      : totalRecords === 0
        ? [
            config.fallbackConclusion[0],
            'During the selected reporting period, no approved records were available in the repository. The institution should continue encouraging participation and maintaining systematic documentation as activities are completed.',
            config.fallbackConclusion[config.fallbackConclusion.length - 1],
          ]
        : [...config.fallbackConclusion];

    return { introduction, conclusion, source: 'fallback' };
  };

  if (!isGeminiConfigured()) {
    return buildFallback();
  }

  try {
    const systemPath = path.join(config.promptsDir, 'narrative.system.txt');
    const userPath = path.join(config.promptsDir, 'narrative.user.template.txt');
    const systemInstruction = await fs.readFile(systemPath, 'utf8');
    const userTemplate = await fs.readFile(userPath, 'utf8');

    const scopedInstruction =
      modules.length === 1
        ? `\n\nSCOPE: This report covers ONLY "${modules[0].heading}". Do not mention other student or faculty activity types. Do not invent student names, event names, dates, organizations, awards, rankings, or sponsorship amounts. If a fact is not in the provided counts, omit it.`
        : '';

    const prompt = userTemplate
      .replace('{{academicYear}}', context.academicYear)
      .replace('{{department}}', context.department)
      .replace('{{statsSummary}}', buildStatsSummary(aggregation, modules))
      .replace('{{moduleSummary}}', buildModuleSummary(modules))
      .replace('{{totalRecords}}', String(totalRecords));

    await geminiProvider.initialize();
    const response = await geminiProvider.generateJSON<{
      introduction?: string[];
      conclusion?: string[];
    }>({
      prompt,
      systemInstruction: `${systemInstruction}${scopedInstruction}`,
      temperature: 0,
    });

    const introduction = Array.isArray(response.data.introduction)
      ? response.data.introduction.filter(Boolean).map(String)
      : [];
    const conclusion = Array.isArray(response.data.conclusion)
      ? response.data.conclusion.filter(Boolean).map(String)
      : [];

    if (introduction.length === 0 || conclusion.length === 0) {
      throw new Error('Gemini returned empty introduction or conclusion');
    }

    const introWords = introduction.join(' ').split(/\s+/).length;
    const conclusionWords = conclusion.join(' ').split(/\s+/).length;
    if (introWords < TARGET_WORDS - 30 || conclusionWords < TARGET_WORDS - 30) {
      logger.warn('Template narrative word count below target — using generated content', {
        introWords,
        conclusionWords,
      });
    }

    return { introduction, conclusion, source: 'gemini' };
  } catch (error) {
    logger.error('Template narrative generation failed — using fallback', {
      error: error instanceof Error ? error.message : String(error),
    });
    return buildFallback();
  }
};
