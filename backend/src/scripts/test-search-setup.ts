/**
 * Smart Search module setup tests.
 *
 * Verifies module structure, Gemini wiring, and that search logic remains unimplemented.
 * Does NOT call Gemini or execute database queries.
 *
 * Run: npm run test:search-setup
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import {
  DEFAULT_SMART_SEARCH_COLLECTIONS,
  searchService,
  smartSearchAgent,
  smartSearchResultSchema,
} from '../search';
import { geminiProvider, isGeminiConfigured, renderPromptTemplateByName } from '../ai';
import { BadRequestError } from '../utils/errors';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const assertRejects = async (
  action: () => Promise<unknown>,
  message: string,
): Promise<void> => {
  try {
    await action();
    throw new Error(`FAIL: ${message}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('FAIL:')) {
      throw error;
    }
    assert(true, message);
  }
};

const testModuleStructure = async (): Promise<void> => {
  console.log('\n--- Module structure ---');

  const requiredPaths = [
    '../search/index.ts',
    '../search/services/search.service.ts',
    '../search/agents/smart-search.agent.ts',
    '../search/config/search-collections.config.ts',
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
    confidence: 85,
  });

  assert(parsed.success, 'Smart search result schema accepts valid payload');
};

const testModuleStatus = (): void => {
  console.log('\n--- Module status ---');

  const status = searchService.getModuleStatus();

  assert(status.implemented === false, 'Search module reports not implemented');
  assert(status.geminiConfigured === isGeminiConfigured(), 'Gemini configured flag matches environment');
  assert(status.supportedCollections.length === DEFAULT_SMART_SEARCH_COLLECTIONS.length, 'Supported collections are exposed');
};

const testUnimplementedLogic = async (): Promise<void> => {
  console.log('\n--- Unimplemented search logic ---');

  await assertRejects(
    () =>
      smartSearchAgent.parseQuery({
        query: 'publications by Dr. Rao',
      }),
    'SmartSearchAgent.parseQuery remains unimplemented',
  );

  await assertRejects(
    () =>
      searchService.search(
        {
          query: 'student achievements in 2023',
        },
        'test-user-id',
      ),
    'SearchService.search remains unimplemented',
  );

  try {
    await searchService.search({ query: 'test' }, 'test-user-id');
  } catch (error) {
    assert(error instanceof BadRequestError, 'SearchService.search throws BadRequestError');
  }
};

const runTests = async (): Promise<void> => {
  console.log('Running Smart Search module setup tests...');

  await testModuleStructure();
  await testGeminiIntegration();
  testSearchSchema();
  testModuleStatus();
  await testUnimplementedLogic();

  console.log('\nAll Smart Search module setup tests passed.');
};

runTests().catch((error) => {
  console.error('\nSmart Search module setup tests failed:', error);
  process.exit(1);
});
