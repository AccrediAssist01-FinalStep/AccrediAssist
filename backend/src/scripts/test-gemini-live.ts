/**
 * Live Gemini API connectivity test.
 * Run: npm run test:gemini-live
 */

import dotenv from 'dotenv';
import { GeminiProvider } from '../ai/providers/gemini.provider';
import { isGeminiConfigured } from '../ai/utils/ai-config.util';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const run = async (): Promise<void> => {
  console.log('Testing live Gemini API connection...\n');
  console.log(`Model: ${process.env.GEMINI_MODEL ?? 'default'}`);
  console.log(`Key prefix: ${(process.env.GEMINI_API_KEY ?? '').slice(0, 8)}...\n`);

  assert(isGeminiConfigured(), 'GEMINI_API_KEY is configured');

  const provider = new GeminiProvider();
  const textResponse = await provider.generateText({
    prompt: 'Reply with exactly: GEMINI_OK',
    temperature: 0,
  });

  assert(textResponse.content.includes('GEMINI_OK') || textResponse.content.includes('OK'), 'Gemini text response received');

  const jsonResponse = await provider.generateJSON<{ status: string }>({
    prompt: 'Return JSON: {"status":"connected"}',
    temperature: 0,
  });

  assert(jsonResponse.data.status === 'connected', 'Gemini JSON response parsed correctly');

  console.log('\nGemini API is working correctly.');
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('\nGemini live test failed:', message.slice(0, 500));

  if (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
    console.error('\nDiagnosis: Requests reach Gemini but the API key has zero free-tier quota.');
    console.error('Fix: Use a standard Gemini API key (starts with AIzaSy...) from https://aistudio.google.com/apikey');
    console.error('     or enable billing on the Google Cloud project linked to this key.');
  }

  process.exit(1);
});
