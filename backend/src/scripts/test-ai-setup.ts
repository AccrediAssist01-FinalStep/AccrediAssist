/**
 * AI module initialization tests (Gemini).
 *
 * Verifies module structure, SDK availability, and provider initialization.
 * Does NOT call the Gemini model, create prompts, or process WhatsApp messages.
 *
 * Run: npm run test:ai-setup
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import {
  aiService,
  geminiProvider,
  getAiConfig,
  isGeminiConfigured,
} from '../ai';

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
    '../ai/index.ts',
    '../ai/providers/gemini.provider.ts',
    '../ai/services/ai.service.ts',
    '../ai/interfaces/ai-config.interface.ts',
    '../ai/interfaces/ai-provider.interface.ts',
    '../ai/utils/ai-config.util.ts',
    '../ai/utils/prompt-template.util.ts',
    '../ai/templates/extraction/v1.system.txt',
    '../ai/templates/classification/v1.system.txt',
    '../ai/templates/validation/v1.system.txt',
    '../ai/templates/report-summary/v1.system.txt',
    '../ai/templates/smart-search/v1.system.txt',
  ];

  for (const relativePath of requiredPaths) {
    await fs.access(path.resolve(__dirname, relativePath));
    assert(true, `Required AI file exists: ${relativePath.replace('../', '')}`);
  }
};

const testGeminiSdk = async (): Promise<void> => {
  console.log('\n--- Google Gen AI SDK ---');

  const module = await import('@google/genai');
  assert(typeof module.GoogleGenAI === 'function', '@google/genai SDK loads successfully');
};

const testAiConfiguration = (): void => {
  console.log('\n--- AI configuration ---');

  const config = getAiConfig();
  assert(config.provider === 'gemini', 'AI provider defaults to gemini');
  assert(config.model === 'gemini-2.5-flash', 'Default Gemini model is gemini-2.5-flash');
  assert(typeof isGeminiConfigured() === 'boolean', 'Gemini configuration check is available');
};

const testProviderInitialization = async (): Promise<void> => {
  console.log('\n--- Gemini provider initialization ---');

  const status = await aiService.initialize();
  assert(status.provider === 'gemini', 'AI service reports gemini provider');
  assert(status.model === geminiProvider.getModel(), 'AI service exposes configured model');
  assert(status.initialized === true, 'Gemini provider is initialized');
  assert(
    status.configured === isGeminiConfigured(),
    'Configured status matches GEMINI_API_KEY presence',
  );

  if (isGeminiConfigured()) {
    assert(geminiProvider.getClient() !== null, 'Gemini client is created when API key is set');
  } else {
    assert(geminiProvider.getClient() === null, 'Gemini client is not created without API key');
  }
};

const testProviderMethods = (): void => {
  console.log('\n--- Provider methods ---');

  assert(typeof geminiProvider.generateText === 'function', 'generateText method is available');
  assert(typeof geminiProvider.generateJSON === 'function', 'generateJSON method is available');
};

const testProviderSkeletonMethods = async (): Promise<void> => {
  console.log('\n--- Agent skeleton methods ---');

  await assertRejects(
    () => geminiProvider.extractInformation(),
    'extractInformation remains unimplemented',
  );
  await assertRejects(
    () => geminiProvider.classifyRecord(),
    'classifyRecord remains unimplemented',
  );
  await assertRejects(
    () => geminiProvider.validateRecord(),
    'validateRecord remains unimplemented',
  );
  await assertRejects(
    () => geminiProvider.detectDuplicate(),
    'detectDuplicate remains unimplemented',
  );
  await assertRejects(
    () => geminiProvider.interpretSearchQuery(),
    'interpretSearchQuery remains unimplemented',
  );
  await assertRejects(
    () => geminiProvider.generateReport(),
    'generateReport remains unimplemented',
  );
  await assertRejects(
    () => geminiProvider.processCommunication(),
    'processCommunication remains unimplemented',
  );
};

const runTests = async (): Promise<void> => {
  console.log('Running AI module initialization tests...');

  await testModuleStructure();
  await testGeminiSdk();
  testAiConfiguration();
  await testProviderInitialization();
  testProviderMethods();
  await testProviderSkeletonMethods();

  console.log('\nAll AI module initialization tests passed.');
};

runTests().catch((error) => {
  console.error('\nAI module initialization tests failed:', error);
  process.exit(1);
});
