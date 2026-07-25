/**
 * Smart Search module setup tests.
 *
 * Verifies module structure, Gemini wiring, and query parsing scaffolding.
 * Live Gemini calls are covered by test:smart-search-query.
 *
 * Run: npm run test:search-setup
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import {
  DEFAULT_SMART_SEARCH_COLLECTIONS,
  normalizeSmartSearchResult,
  searchService,
  smartSearchAgent,
  smartSearchResultSchema,
} from '../search';
import { geminiProvider, isGeminiConfigured, renderPromptTemplateByName } from '../ai';
import { GeminiGenerativeClient } from '../ai/interfaces/gemini-client.interface';
import { GeminiProvider } from '../ai/providers/gemini.provider';
import { SmartSearchAgent } from '../search/agents/smart-search.agent';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const testModuleStructure = async (): Promise<void> => {
  console.log('\n--- Module structure ---');

  const requiredPaths = [
    '../search/index.ts',
    '../search/services/search.service.ts',
    '../search/agents/smart-search.agent.ts',
    '../search/config/search-collections.config.ts',
    '../search/config/search-fields.config.ts',
    '../search/interfaces/search.interface.ts',
    '../search/interfaces/smart-search.interface.ts',
    '../search/utils/smart-search-result.util.ts',
    '../controllers/search.controller.ts',
    '../routes/search.routes.ts',
    '../validations/search.validation.ts',
    '../ai/templates/smart-search/v1.system.txt',
    '../ai/templates/smart-search/v1.user.template.txt',
  ];

  for (const relativePath of requiredPaths) {
    await fs.access(path.resolve(__dirname, relativePath));
    assert(true, `Required search file exists: ${relativePath.replace('../', '')}`);
  }
};

const testGeminiIntegration = async (): Promise<void> => {
  console.log('\n--- Gemini integration ---');

  assert(
    smartSearchAgent.getProvider() === geminiProvider,
    'SmartSearchAgent uses the shared GeminiProvider instance',
  );

  const prompt = await renderPromptTemplateByName('smart-search', {
    query: 'placements in CSE above 10 LPA',
    department: 'CSE',
    collections: DEFAULT_SMART_SEARCH_COLLECTIONS.join('\n'),
  });

  assert(prompt.system.length > 0, 'Smart search system prompt loads from template');
  assert(prompt.userPrompt.includes('placements in CSE above 10 LPA'), 'User prompt renders query variable');

  const builtPrompt = await smartSearchAgent.buildPrompt({
    query: 'internships in 2024',
    department: 'CSE',
  });

  assert(builtPrompt.system.length > 0, 'SmartSearchAgent.buildPrompt returns system prompt');
  assert(builtPrompt.userPrompt.includes('internships in 2024'), 'SmartSearchAgent.buildPrompt renders query');
};

const testSearchSchema = (): void => {
  console.log('\n--- Search result schema ---');

  const parsed = smartSearchResultSchema.safeParse({
    collection: 'placements',
    filters: { department: 'CSE' },
    sort: 'latest',
    confidence: 85,
  });

  assert(parsed.success, 'Smart search result schema accepts valid payload');

  const normalized = normalizeSmartSearchResult({
    collection: 'Placement',
    filters: { company: 'TCS' },
    sort: 'newest',
    confidence: 90,
  });

  assert(normalized.collection === 'placements', 'Collection aliases normalize to internal names');
  assert(normalized.sort === 'latest', 'Sort aliases normalize to supported values');
};

const testModuleStatus = (): void => {
  console.log('\n--- Module status ---');

  const status = searchService.getModuleStatus();

  assert(status.queryUnderstanding === true, 'Query understanding is enabled');
  assert(status.databaseSearch === true, 'Database search is enabled');
  assert(status.integrated === true, 'Gemini and MongoDB search are integrated');
  assert(status.geminiConfigured === isGeminiConfigured(), 'Gemini configured flag matches environment');
  assert(status.supportedCollections.length === DEFAULT_SMART_SEARCH_COLLECTIONS.length, 'Supported collections are exposed');
};

const testMockedParseQuery = async (): Promise<void> => {
  console.log('\n--- Mocked parseQuery ---');

  const mockClient: GeminiGenerativeClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          collection: 'internships',
          filters: { year: 2026 },
          sort: '',
          confidence: 88,
        }),
      }),
    },
  };

  const agent = new SmartSearchAgent(new GeminiProvider(mockClient));
  const response = await agent.parseQuery({
    query: 'Show all internships completed in 2026.',
  });

  assert(response.result.collection === 'internships', 'parseQuery returns structured collection');
  assert(response.result.filters.year === 2026, 'parseQuery returns structured filters');
};

const runTests = async (): Promise<void> => {
  console.log('Running Smart Search module setup tests...');

  await testModuleStructure();
  await testGeminiIntegration();
  testSearchSchema();
  testModuleStatus();
  await testMockedParseQuery();

  console.log('\nAll Smart Search module setup tests passed.');
};

runTests().catch((error) => {
  console.error('\nSmart Search module setup tests failed:', error);
  process.exit(1);
});
