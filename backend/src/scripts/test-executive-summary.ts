/**
 * AI Executive Summary Generator tests.
 *
 * Run: npm run test:executive-summary
 *
 * Uses mocked Gemini by default. Set RUN_LIVE_GEMINI=1 to optionally
 * exercise the live API when GEMINI_API_KEY is configured.
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { Internship } from '../models/Internship';
import { Patent } from '../models/Patent';
import { Placement } from '../models/Placement';
import { Publication } from '../models/Publication';
import { StudentAchievement } from '../models/StudentAchievement';
import { GeminiProvider } from '../ai/providers/gemini.provider';
import { GeminiGenerativeClient } from '../ai/interfaces/gemini-client.interface';
import { GENERATION_REPORT_TYPES } from '../report-generation/config/report-types.config';
import type { ReportAggregationResult } from '../report-generation/aggregation/interfaces/aggregation.interface';
import { aggregationService } from '../report-generation/aggregation/services/aggregation.service';
import { dataCollectionService } from '../report-generation/services/data-collection.service';
import { aiSummaryService } from '../report-generation/services/ai-summary.service';
import { ExecutiveSummaryService } from '../report-generation/summary/services/executive-summary.service';
import { buildFallbackExecutiveSummary } from '../report-generation/summary/utils/executive-summary.fallback';
import {
  buildAggregatedDataPayload,
  buildExecutiveSummaryPrompt,
} from '../report-generation/summary/utils/summary-prompt.util';
import { validateExecutiveSummaryResponse } from '../report-generation/summary/utils/executive-summary.validator';
import { executiveSummaryResponseSchema } from '../report-generation/summary/interfaces/executive-summary.interface';

dotenv.config();

const TEST_PREFIX = 'exec-summary-test-';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const createMockGeminiClient = (payload: Record<string, unknown>): GeminiGenerativeClient => ({
  models: {
    generateContent: async () => ({
      text: JSON.stringify(payload),
    }),
  },
});

const createMockGeminiClientInvalidJson = (): GeminiGenerativeClient => ({
  models: {
    generateContent: async () => ({
      text: 'not valid json {{{',
    }),
  },
});

const createSyntheticAggregation = (): ReportAggregationResult => ({
  metadata: {
    generatedAt: new Date().toISOString(),
    filters: { department: 'Computer Engineering' },
    resolvedDateRange: { label: '2025-2026' },
    modules: ['placements', 'internships'],
    queryDurationMs: 42,
  },
  statistics: {
    overall: {
      totalRecords: 30,
      moduleTotals: {
        studentAchievements: 0,
        facultyAchievements: 0,
        placements: 20,
        internships: 10,
        publications: 0,
        patents: 0,
        completedEventReports: 0,
        pendingReviews: 0,
      },
      growthPercentage: 15,
    },
    byModule: {
      placements: {
        module: 'placements',
        label: 'Placements',
        totalCount: 20,
        monthlyCount: [{ year: 2025, month: 6, period: 'Jun 2025', count: 12 }],
        yearlyCount: [{ year: 2025, count: 20 }],
        departmentWiseCount: [{ label: 'Computer Engineering', count: 15 }],
        categoryWiseCount: [],
        topPerformers: [{ name: 'TCS', count: 8 }],
        latestRecords: [],
        growthPercentage: 10,
        previousPeriodCount: 18,
      },
      internships: {
        module: 'internships',
        label: 'Internships',
        totalCount: 10,
        monthlyCount: [{ year: 2025, month: 5, period: 'May 2025', count: 6 }],
        yearlyCount: [{ year: 2025, count: 10 }],
        departmentWiseCount: [{ label: 'Computer Engineering', count: 7 }],
        categoryWiseCount: [],
        topPerformers: [{ name: 'Infosys', count: 4 }],
        latestRecords: [],
        growthPercentage: 25,
        previousPeriodCount: 8,
      },
    },
  },
  charts: { byModule: {} },
  records: { byModule: {} },
  summary: {
    highlights: ['30 total institutional records'],
    topDepartments: [{ label: 'Computer Engineering', count: 22 }],
    topCategories: [],
    moduleCount: 2,
  },
});

const validSummaryPayload = {
  executiveSummary:
    'The institution recorded 30 placement and internship outcomes during 2025-2026. Computer Engineering contributed the highest departmental share. Placement volume increased by 10% compared to the prior period.',
  strengths: ['Placements increased by 10% versus the previous period.'],
  observations: ['Computer Engineering accounts for the majority of placement records.'],
  recommendations: ['Maintain structured internship tracking across all departments.'],
  keyHighlights: ['30 total records', '20 placements', '10 internships'],
};

const assertSummaryShape = (summary: {
  executiveSummary: string;
  strengths: string[];
  observations: string[];
  recommendations: string[];
  keyHighlights: string[];
  source: 'gemini' | 'fallback';
}): void => {
  executiveSummaryResponseSchema.parse({
    executiveSummary: summary.executiveSummary,
    strengths: summary.strengths,
    observations: summary.observations,
    recommendations: summary.recommendations,
    keyHighlights: summary.keyHighlights,
  });
  assert(summary.executiveSummary.length > 0, 'executiveSummary is non-empty');
  assert(['gemini', 'fallback'].includes(summary.source), 'source is gemini or fallback');
};

const seedSampleData = async (): Promise<void> => {
  await Promise.all([
    StudentAchievement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    FacultyAchievement.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Placement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Internship.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Publication.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Patent.deleteMany({ patentTitle: { $regex: TEST_PREFIX } }),
    CompletedEventReport.deleteMany({ eventTitle: { $regex: TEST_PREFIX } }),
  ]);

  await StudentAchievement.create({
    studentName: `${TEST_PREFIX}Rahul`,
    department: 'Computer Engineering',
    achievementType: 'Technical',
    title: 'Hackathon Winner',
    date: new Date('2025-08-15'),
  });
  await Placement.create({
    studentName: `${TEST_PREFIX}Rahul`,
    department: 'Computer Engineering',
    company: 'TCS',
    role: 'Software Engineer',
    joiningDate: new Date('2025-06-01'),
  });
  await Internship.create({
    studentName: `${TEST_PREFIX}Priya`,
    company: 'Infosys',
    role: 'Intern',
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-07-31'),
  });
  await Publication.create({
    facultyName: `${TEST_PREFIX}Dr. Sharma`,
    paperTitle: `${TEST_PREFIX} ML Paper`,
    journal: 'IEEE Access',
    publicationDate: new Date('2025-03-01'),
  });
  await Patent.create({
    patentTitle: `${TEST_PREFIX} Smart Campus`,
    inventors: [`${TEST_PREFIX}Dr. Sharma`],
    status: 'Filed',
    filingDate: new Date('2025-01-15'),
  });
  await CompletedEventReport.create({
    eventTitle: `${TEST_PREFIX} Workshop`,
    eventType: 'Workshop',
    date: new Date('2025-02-10'),
    coordinator: `${TEST_PREFIX}Dr. Sharma`,
    participants: 80,
  });
};

const cleanupSampleData = async (): Promise<void> => {
  await Promise.all([
    StudentAchievement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    FacultyAchievement.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Placement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Internship.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Publication.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Patent.deleteMany({ patentTitle: { $regex: TEST_PREFIX } }),
    CompletedEventReport.deleteMany({ eventTitle: { $regex: TEST_PREFIX } }),
  ]);
};

const runUnitTests = async (): Promise<void> => {
  console.log('--- Unit tests (no database) ---\n');

  const validated = validateExecutiveSummaryResponse(validSummaryPayload);
  assert(validated.executiveSummary.includes('30'), 'Validator accepts valid summary');
  assert(validated.strengths.length === 1, 'Validator preserves strengths');

  let validationFailed = false;
  try {
    validateExecutiveSummaryResponse({ executiveSummary: '', strengths: [], observations: [], recommendations: [], keyHighlights: [] });
  } catch {
    validationFailed = true;
  }
  assert(validationFailed, 'Validator rejects empty executiveSummary');

  const aggregation = createSyntheticAggregation();
  const fallback = buildFallbackExecutiveSummary('Placement', aggregation, 'test fallback');
  assertSummaryShape(fallback);
  assert(fallback.source === 'fallback', 'Fallback summary uses fallback source');
  assert(fallback.executiveSummary.includes('Placement Report'), 'Fallback references report label');

  const payloadA = buildAggregatedDataPayload('NBA', aggregation);
  const payloadB = buildAggregatedDataPayload('NBA', aggregation);
  assert(JSON.stringify(payloadA) === JSON.stringify(payloadB), 'Aggregation payload is deterministic');

  const promptA = await buildExecutiveSummaryPrompt('NBA', aggregation);
  const promptB = await buildExecutiveSummaryPrompt('NBA', aggregation);
  assert(promptA.prompt === promptB.prompt, 'Prompt rendering is deterministic');
  assert(promptA.systemInstruction.includes('NBA'), 'System prompt includes report context');

  const mockProvider = new GeminiProvider(createMockGeminiClient(validSummaryPayload));
  const mockService = new ExecutiveSummaryService(mockProvider);

  for (const reportType of GENERATION_REPORT_TYPES) {
    const { summary } = await mockService.generate(reportType, aggregation);
    assertSummaryShape(summary);
    assert(summary.source === 'gemini', `Mock Gemini summary for ${reportType}`);
  }

  const invalidJsonService = new ExecutiveSummaryService(
    new GeminiProvider(createMockGeminiClientInvalidJson()),
  );
  const invalidResult = await invalidJsonService.generate('Placement', aggregation);
  assert(invalidResult.usedFallback, 'Invalid JSON triggers fallback');
  assertSummaryShape(invalidResult.summary);
  assert(invalidResult.summary.source === 'fallback', 'Invalid JSON uses fallback source');

  const invalidSchemaService = new ExecutiveSummaryService(
    new GeminiProvider(
      createMockGeminiClient({
        executiveSummary: 'Only summary field',
        strengths: [],
        observations: [],
        recommendations: [],
      }),
    ),
  );
  const schemaFail = await invalidSchemaService.generate('Internship', aggregation);
  assert(schemaFail.usedFallback, 'Invalid schema triggers fallback');

  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const unconfiguredService = new ExecutiveSummaryService();
  const unconfiguredResult = await unconfiguredService.generate('Publication', aggregation);
  assert(unconfiguredResult.usedFallback, 'Missing API key triggers fallback');
  if (originalKey) {
    process.env.GEMINI_API_KEY = originalKey;
  }

  console.log('');
};

const runIntegrationTests = async (): Promise<void> => {
  console.log('--- Integration tests (database) ---\n');

  await connectDatabase();
  await seedSampleData();

  const mockProvider = new GeminiProvider(createMockGeminiClient(validSummaryPayload));
  const mockService = new ExecutiveSummaryService(mockProvider);

  for (const reportType of GENERATION_REPORT_TYPES) {
    const collected = await dataCollectionService.collect(reportType, {});
    assert(!!collected.aggregation, `Collected aggregation for ${reportType}`);

    const { summary } = await mockService.generate(reportType, collected.aggregation!);
    assertSummaryShape(summary);
    assert(summary.source === 'gemini', `Integration mock Gemini for ${reportType}`);
  }

  const placementCollected = await dataCollectionService.collect('Placement', {});
  const context = await aiSummaryService.summarizeForContext({
    reportType: 'Placement',
    filters: {},
    collectedData: placementCollected,
  });
  assert(!!context.aiSummary, 'Pipeline aiSummary attached');
  assertSummaryShape(context.aiSummary!);
  assert(context.aiSummary!.executiveSummary.length > 0, 'Pipeline summary has narrative');

  const liveAggregation = await aggregationService.aggregate({});
  const liveFallback = buildFallbackExecutiveSummary('NAAC', liveAggregation, 'integration test');
  assertSummaryShape(liveFallback);

  await cleanupSampleData();
  await disconnectDatabase();

  console.log('');
};

const runLiveGeminiTest = async (): Promise<void> => {
  if (process.env.RUN_LIVE_GEMINI !== '1' || !process.env.GEMINI_API_KEY) {
    console.log('--- Live Gemini test skipped (set RUN_LIVE_GEMINI=1) ---\n');
    return;
  }

  console.log('--- Live Gemini test ---\n');
  await connectDatabase();

  const collected = await dataCollectionService.collect('Placement', {});
  const liveService = new ExecutiveSummaryService();
  const { summary, usedFallback } = await liveService.generate(
    'Placement',
    collected.aggregation!,
  );

  assertSummaryShape(summary);
  assert(!usedFallback, 'Live Gemini generation succeeds');
  assert(summary.source === 'gemini', 'Live summary source is gemini');

  await disconnectDatabase();
  console.log('');
};

const runTests = async (): Promise<void> => {
  console.log('Running AI Executive Summary Generator tests...\n');
  await runUnitTests();
  await runIntegrationTests();
  await runLiveGeminiTest();
  console.log('All executive summary tests passed.');
};

runTests().catch(async (error) => {
  console.error(error);
  await cleanupSampleData().catch(() => undefined);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
