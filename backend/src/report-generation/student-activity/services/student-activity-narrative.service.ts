import fs from 'fs/promises';
import path from 'path';
import { geminiProvider } from '../../../ai/providers/gemini.provider';
import { isGeminiConfigured } from '../../../ai';
import { logger } from '../../../utils/logger';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import {
  TEMPLATE_FALLBACK_CONCLUSION,
  TEMPLATE_FALLBACK_INTRODUCTION,
} from '../student-activity-report-template.config';
import type { StudentActivityModuleTable } from '../student-activity-report.types';

const PROMPTS_DIR = path.join(__dirname, '..', 'templates');
const TARGET_WORDS = 200;
const WORD_TOLERANCE = 30;

const countWords = (paragraphs: string[]): number =>
  paragraphs.join(' ').split(/\s+/).filter(Boolean).length;

const loadPrompt = async (fileName: string): Promise<string> => {
  const filePath = path.join(PROMPTS_DIR, fileName);
  return fs.readFile(filePath, 'utf8');
};

const buildModuleSummary = (modules: StudentActivityModuleTable[]): string =>
  modules
    .map((module) => `${module.heading}: ${module.rows.length} record(s)`)
    .join('\n');

const buildStatsSummary = (aggregation: ReportAggregationResult): string => {
  const overall = aggregation.statistics.overall.totalRecords;
  const byModule = Object.entries(aggregation.statistics.byModule)
    .map(([key, stats]) => `${stats?.label ?? key}: ${stats?.totalCount ?? 0}`)
    .join(', ');
  return `Total records: ${overall}. Breakdown: ${byModule}`;
};

const adaptFallbackIntroduction = (
  modules: StudentActivityModuleTable[],
  academicYear: string,
  department: string,
): string[] => {
  const totalRecords = modules.reduce((sum, module) => sum + module.rows.length, 0);
  const activeModules = modules.filter((module) => module.rows.length > 0).length;

  return [
    TEMPLATE_FALLBACK_INTRODUCTION[0],
    TEMPLATE_FALLBACK_INTRODUCTION[1],
    `The following report presents student achievements across all identified modules for ${department} during academic year ${academicYear}. A total of ${totalRecords} approved record(s) are documented across ${activeModules} active module(s). Each module table includes the student name, type of achievement, title, organization, and date in the institutional format.`,
  ];
};

const adaptFallbackConclusion = (
  modules: StudentActivityModuleTable[],
  totalRecords: number,
): string[] => {
  if (totalRecords === 0) {
    return [
      TEMPLATE_FALLBACK_CONCLUSION[0],
      'During the selected reporting period, no approved student achievement records were available in the repository. The institution should continue encouraging participation and maintaining systematic documentation as activities are completed.',
      TEMPLATE_FALLBACK_CONCLUSION[2],
    ];
  }

  return TEMPLATE_FALLBACK_CONCLUSION;
};

export interface StudentActivityNarrative {
  introduction: string[];
  conclusion: string[];
  source: 'gemini' | 'fallback';
}

export const generateStudentActivityNarrative = async (
  aggregation: ReportAggregationResult,
  modules: StudentActivityModuleTable[],
  context: { academicYear: string; department: string },
): Promise<StudentActivityNarrative> => {
  const totalRecords = modules.reduce((sum, module) => sum + module.rows.length, 0);

  if (!isGeminiConfigured()) {
    return {
      introduction: adaptFallbackIntroduction(modules, context.academicYear, context.department),
      conclusion: adaptFallbackConclusion(modules, totalRecords),
      source: 'fallback',
    };
  }

  try {
    const systemInstruction = await loadPrompt('narrative.system.txt');
    const userTemplate = await loadPrompt('narrative.user.template.txt');

    const prompt = userTemplate
      .replace('{{academicYear}}', context.academicYear)
      .replace('{{department}}', context.department)
      .replace('{{statsSummary}}', buildStatsSummary(aggregation))
      .replace('{{moduleSummary}}', buildModuleSummary(modules))
      .replace('{{totalRecords}}', String(totalRecords));

    await geminiProvider.initialize();
    const response = await geminiProvider.generateJSON<{
      introduction?: string[];
      conclusion?: string[];
    }>({
      prompt,
      systemInstruction,
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

    const introWords = countWords(introduction);
    const conclusionWords = countWords(conclusion);

    if (
      introWords < TARGET_WORDS - WORD_TOLERANCE ||
      introWords > TARGET_WORDS + WORD_TOLERANCE + 50 ||
      conclusionWords < TARGET_WORDS - WORD_TOLERANCE ||
      conclusionWords > TARGET_WORDS + WORD_TOLERANCE + 50
    ) {
      logger.warn('Student activity narrative word count outside target range — using content anyway', {
        introWords,
        conclusionWords,
      });
    }

    return { introduction, conclusion, source: 'gemini' };
  } catch (error) {
    logger.error('Student activity narrative generation failed — using template fallback', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      introduction: adaptFallbackIntroduction(modules, context.academicYear, context.department),
      conclusion: adaptFallbackConclusion(modules, totalRecords),
      source: 'fallback',
    };
  }
};
