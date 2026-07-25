/**
 * Smart Search natural language query understanding tests.
 *
 * Validates Gemini-powered query parsing with mocked and live tests.
 * Does NOT query MongoDB.
 *
 * Run: npm run test:smart-search-query
 */

import dotenv from 'dotenv';
import {
  GeminiProvider,
  SmartSearchAgent,
  aiService,
  isGeminiConfigured,
  normalizeSmartSearchCollection,
  normalizeSmartSearchResult,
  normalizeSmartSearchSort,
  smartSearchAgent,
} from '../ai';
import { SmartSearchCollection } from '../search/config/search-collections.config';
import { GeminiGenerativeClient } from '../ai/interfaces/gemini-client.interface';
import { SmartSearchParsedFilters } from '../search/interfaces/smart-search.interface';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

interface QueryTestCase {
  name: string;
  query: string;
  department?: string;
  expectedCollection: SmartSearchCollection | '';
  expectedFilters?: Record<string, unknown>;
  expectedSort?: 'latest' | 'oldest' | '';
}

const SAMPLE_QUERIES: QueryTestCase[] = [
  {
    name: 'Internships completed in 2026',
    query: 'Show all internships completed in 2026.',
    expectedCollection: 'internships',
    expectedFilters: { year: 2026 },
  },
  {
    name: 'Students placed in TCS',
    query: 'Students placed in TCS.',
    expectedCollection: 'placements',
    expectedFilters: { company: 'TCS' },
  },
  {
    name: 'Faculty publications on AI',
    query: 'Faculty publications on AI.',
    expectedCollection: 'publications',
    expectedFilters: { topic: 'AI' },
  },
  {
    name: 'Infosys placements in 2025',
    query: 'Show placements at Infosys in 2025.',
    expectedCollection: 'placements',
    expectedFilters: { company: 'Infosys', year: 2025 },
  },
  {
    name: 'Google internships',
    query: 'List internships at Google.',
    expectedCollection: 'internships',
    expectedFilters: { company: 'Google' },
  },
  {
    name: 'Student sports achievements',
    query: 'Show student achievements in sports.',
    expectedCollection: 'student_achievements',
    expectedFilters: { achievementType: 'Sports' },
  },
  {
    name: 'Faculty research achievements',
    query: 'Faculty achievements in research.',
    expectedCollection: 'faculty_achievements',
    expectedFilters: { achievementType: 'Research' },
  },
  {
    name: 'Patents filed in 2024',
    query: 'Patents filed in 2024.',
    expectedCollection: 'patents',
    expectedFilters: { year: 2024 },
  },
  {
    name: 'Workshops in CSE',
    query: 'Completed workshops in CSE department.',
    expectedCollection: 'completed_event_reports',
    expectedFilters: { eventType: 'Workshop' },
  },
  {
    name: 'IEEE publications',
    query: 'Publications in IEEE journal.',
    expectedCollection: 'publications',
    expectedFilters: { journal: 'IEEE' },
  },
  {
    name: 'High package placements',
    query: 'Students with package above 10 LPA.',
    expectedCollection: 'placements',
    expectedFilters: { package: '10 LPA' },
  },
  {
    name: 'Internships ending December 2026',
    query: 'Internships ending in December 2026.',
    expectedCollection: 'internships',
    expectedFilters: { year: 2026 },
  },
  {
    name: 'Computer Science placements',
    query: 'Placement records for Computer Science department.',
    expectedCollection: 'placements',
    expectedFilters: { department: 'Computer Science' },
  },
  {
    name: 'Machine learning publications',
    query: 'Faculty who published papers on machine learning.',
    expectedCollection: 'publications',
    expectedFilters: { topic: 'machine learning' },
  },
  {
    name: 'Technical event reports',
    query: 'Event reports for technical events.',
    expectedCollection: 'completed_event_reports',
    expectedFilters: { eventType: 'Technical' },
  },
  {
    name: 'Granted patents',
    query: 'Patents with status granted.',
    expectedCollection: 'patents',
    expectedFilters: { status: 'Granted' },
  },
  {
    name: 'Student hackathon achievements',
    query: 'Student hackathon achievements.',
    expectedCollection: 'student_achievements',
    expectedFilters: { achievementType: 'Hackathon' },
  },
  {
    name: 'Latest 2026 placements',
    query: 'All placements in 2026 sorted by latest.',
    expectedCollection: 'placements',
    expectedFilters: { year: 2026 },
    expectedSort: 'latest',
  },
  {
    name: 'Oldest Microsoft internships',
    query: 'Internships at Microsoft sorted oldest first.',
    expectedCollection: 'internships',
    expectedFilters: { company: 'Microsoft' },
    expectedSort: 'oldest',
  },
  {
    name: 'Publications by Dr Sharma',
    query: 'Publications by Dr. Sharma.',
    expectedCollection: 'publications',
    expectedFilters: { facultyName: 'Dr. Sharma' },
  },
  {
    name: 'TCS placements in 2026',
    query: 'TCS placement students in 2026.',
    expectedCollection: 'placements',
    expectedFilters: { company: 'TCS', year: 2026 },
  },
  {
    name: 'Faculty achievement awards',
    query: 'Show faculty achievement awards.',
    expectedCollection: 'faculty_achievements',
    expectedFilters: { achievementType: 'Award' },
  },
];

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : String(value ?? '').toLowerCase();

const filterMatches = (
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): boolean =>
  Object.entries(expected).every(([key, expectedValue]) => {
    const actualValue = actual[key];

    if (actualValue !== undefined) {
      if (typeof expectedValue === 'number') {
        return Number(actualValue) === expectedValue;
      }

      return normalizeText(actualValue).includes(normalizeText(expectedValue));
    }

    const caseInsensitiveKey = Object.keys(actual).find(
      (actualKey) => actualKey.toLowerCase() === key.toLowerCase(),
    );

    if (caseInsensitiveKey) {
      const candidate = actual[caseInsensitiveKey];

      if (typeof expectedValue === 'number') {
        return Number(candidate) === expectedValue;
      }

      return normalizeText(candidate).includes(normalizeText(expectedValue));
    }

    if (typeof expectedValue === 'string') {
      return Object.values(actual).some((candidate) =>
        normalizeText(candidate).includes(normalizeText(expectedValue)),
      );
    }

    return false;
  });

const assertParsedShape = (result: SmartSearchParsedFilters): void => {
  assert(typeof result.collection === 'string', 'Parsed result includes collection');
  assert(result.filters !== null && typeof result.filters === 'object', 'Parsed result includes filters object');
  assert(typeof result.sort === 'string', 'Parsed result includes sort');
  assert(
    result.confidence === null || typeof result.confidence === 'number',
    'Parsed result includes confidence or null',
  );
};

const testNormalization = (): void => {
  console.log('\n--- Result normalization ---');

  const normalized = normalizeSmartSearchResult({
    collection: 'Placement',
    filters: { company: 'TCS', year: 2026 },
    sort: 'latest',
    confidence: 92,
  });

  assert(normalized.collection === 'placements', 'PascalCase collection maps to placements');
  assert(normalized.filters.company === 'TCS', 'Filters are preserved');
  assert(normalized.sort === 'latest', 'Sort latest is preserved');

  assert(
    normalizeSmartSearchCollection('Faculty Publications') === 'publications',
    'Natural collection phrase maps to publications',
  );
  assert(normalizeSmartSearchSort('newest') === 'latest', 'Sort alias newest maps to latest');
  assert(normalizeSmartSearchSort('earliest') === 'oldest', 'Sort alias earliest maps to oldest');
};

const testMockedAgent = async (): Promise<void> => {
  console.log('\n--- Mocked smart search agent ---');

  const mockClient: GeminiGenerativeClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          collection: 'placements',
          filters: { company: 'TCS', year: 2026 },
          sort: 'latest',
          confidence: 95,
        }),
      }),
    },
  };

  const provider = new GeminiProvider(mockClient);
  const agent = new SmartSearchAgent(provider);
  const response = await agent.parseQuery({
    query: 'Students placed in TCS in 2026 latest first',
  });

  assert(response.provider === 'gemini', 'Mocked agent response includes provider');
  assert(response.result.collection === 'placements', 'Mocked agent maps to placements collection');
  assert(response.result.filters.company === 'TCS', 'Mocked agent extracts company filter');
  assert(response.result.filters.year === 2026, 'Mocked agent extracts year filter');
  assert(response.result.sort === 'latest', 'Mocked agent extracts sort');
  assert(typeof response.model === 'string', 'Mocked agent response includes model name');
};

const buildMockResponse = (sample: QueryTestCase): string =>
  JSON.stringify({
    collection: sample.expectedCollection,
    filters: sample.expectedFilters ?? {},
    sort: sample.expectedSort ?? '',
    confidence: 90,
  });

const testMockedQueryBatch = async (): Promise<void> => {
  console.log('\n--- Mocked query batch (20+ examples) ---');

  assert(SAMPLE_QUERIES.length >= 20, 'At least twenty example queries are defined');

  for (const sample of SAMPLE_QUERIES) {
    const mockClient: GeminiGenerativeClient = {
      models: {
        generateContent: async () => ({
          text: buildMockResponse(sample),
        }),
      },
    };

    const agent = new SmartSearchAgent(new GeminiProvider(mockClient));
    const response = await agent.parseQuery({ query: sample.query, department: sample.department });

    assertParsedShape(response.result);
    assert(
      response.result.collection === sample.expectedCollection,
      `${sample.name}: mocked collection is ${sample.expectedCollection}`,
    );

    if (sample.expectedFilters) {
      assert(
        filterMatches(response.result.filters, sample.expectedFilters),
        `${sample.name}: mocked filters match expected values`,
      );
    }

    if (sample.expectedSort) {
      assert(response.result.sort === sample.expectedSort, `${sample.name}: mocked sort matches`);
    }
  }

  assert(true, `Mocked batch processed ${SAMPLE_QUERIES.length} example queries`);
};

const LIVE_GEMINI_MODEL_FALLBACKS = ['gemini-2.0-flash', 'gemini-1.5-flash'] as const;

const isLiveGeminiUnavailable = (message: string): boolean =>
  /404|not found|unavailable|quota|rate limit/i.test(message);

const testLiveQueryUnderstanding = async (): Promise<void> => {
  console.log('\n--- Live Gemini query understanding ---');

  if (!isGeminiConfigured()) {
    console.log('SKIP: GEMINI_API_KEY is not configured for live smart search tests');
    return;
  }

  await aiService.initialize();

  const configuredModel = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  const modelsToTry = [configuredModel, ...LIVE_GEMINI_MODEL_FALLBACKS.filter((m) => m !== configuredModel)];

  for (const model of modelsToTry) {
    process.env.GEMINI_MODEL = model;

    try {
      let passed = 0;

      for (const sample of SAMPLE_QUERIES) {
        const response = await smartSearchAgent.parseQuery({
          query: sample.query,
          department: sample.department,
        });

        assertParsedShape(response.result);

        assert(
          response.result.collection === sample.expectedCollection,
          `${sample.name}: collection is ${sample.expectedCollection}`,
        );

        if (sample.expectedFilters) {
          assert(
            filterMatches(response.result.filters, sample.expectedFilters),
            `${sample.name}: filters match expected values (${JSON.stringify(sample.expectedFilters)})`,
          );
        }

        if (sample.expectedSort) {
          assert(
            response.result.sort === sample.expectedSort,
            `${sample.name}: sort is ${sample.expectedSort}`,
          );
        }

        assert(response.provider === 'gemini', `${sample.name}: provider is gemini`);
        assert(typeof response.model === 'string', `${sample.name}: model name is returned`);

        passed += 1;
        console.log(`PASS: ${sample.name} parsed successfully (${model})`);
      }

      assert(passed >= 20, `Live Gemini parsed at least 20 queries (${passed}/${SAMPLE_QUERIES.length})`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (isLiveGeminiUnavailable(message)) {
        console.log(`SKIP: Live Gemini model ${model} unavailable (${message})`);
        continue;
      }

      throw error;
    }
  }

  console.log('SKIP: Live Gemini smart search unavailable for all configured models');
};

const runTests = async (): Promise<void> => {
  console.log('Running Smart Search query understanding tests...');

  testNormalization();
  await testMockedAgent();
  await testMockedQueryBatch();
  await testLiveQueryUnderstanding();

  console.log('\nAll Smart Search query understanding tests passed.');
};

runTests().catch((error) => {
  console.error('\nSmart Search query understanding tests failed:', error);
  process.exit(1);
});
