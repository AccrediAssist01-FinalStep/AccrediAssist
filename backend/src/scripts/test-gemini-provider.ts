/**
 * GeminiProvider unit tests.
 *
 * Uses a mocked Gemini client — does NOT call the live Gemini API,
 * create prompts, or process WhatsApp messages.
 *
 * Run: npm run test:gemini-provider
 */

import dotenv from 'dotenv';
import { GeminiProvider } from '../ai/providers/gemini.provider';
import {
  GeminiGenerativeClient,
  GeminiGenerateContentParams,
} from '../ai/interfaces/gemini-client.interface';
import { BadRequestError, InternalServerError, ValidationError } from '../utils/errors';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const assertRejects = async (
  action: () => Promise<unknown>,
  expectedError: typeof BadRequestError | typeof InternalServerError | typeof ValidationError,
  message: string,
): Promise<void> => {
  try {
    await action();
    throw new Error(`FAIL: ${message}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('FAIL:')) {
      throw error;
    }
    assert(error instanceof expectedError, message);
  }
};

const createMockClient = (
  handler: (params: GeminiGenerateContentParams, attempt: number) => Promise<{ text?: string }>,
): { client: GeminiGenerativeClient; getAttemptCount: () => number } => {
  let attemptCount = 0;

  const client: GeminiGenerativeClient = {
    models: {
      generateContent: async (params) => {
        attemptCount += 1;
        return handler(params, attemptCount);
      },
    },
  };

  return {
    client,
    getAttemptCount: () => attemptCount,
  };
};

const withTestEnv = async (run: () => Promise<void>): Promise<void> => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  process.env.GEMINI_API_KEY = 'test-gemini-api-key';
  process.env.GEMINI_MODEL = 'gemini-2.5-flash';

  try {
    await run();
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }

    if (originalModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = originalModel;
    }
  }
};

const testGenerateTextSuccess = async (): Promise<void> => {
  console.log('\n--- generateText ---');

  await withTestEnv(async () => {
    const { client } = createMockClient(async (params) => {
      assert(params.model === 'gemini-2.5-flash', 'generateText uses model from environment');
      assert(params.contents === 'Summarize accreditation.', 'generateText sends prompt to Gemini');
      assert(
        params.config?.responseMimeType === 'text/plain',
        'generateText requests plain text response',
      );
      return { text: 'Accreditation summary text.' };
    });

    const provider = new GeminiProvider(client);
    const response = await provider.generateText({
      prompt: 'Summarize accreditation.',
      systemInstruction: 'Be concise.',
      temperature: 0.1,
    });

    assert(response.type === 'text', 'generateText returns standardized text response type');
    assert(response.provider === 'gemini', 'generateText response includes provider');
    assert(response.model === 'gemini-2.5-flash', 'generateText response includes model');
    assert(response.content === 'Accreditation summary text.', 'generateText returns content');
  });
};

const testGenerateJsonSuccess = async (): Promise<void> => {
  console.log('\n--- generateJSON ---');

  await withTestEnv(async () => {
    const { client } = createMockClient(async (params) => {
      assert(
        params.config?.responseMimeType === 'application/json',
        'generateJSON requests JSON response mime type',
      );
      return { text: '{"studentName":"Rahul Patil","company":"Infosys"}' };
    });

    const provider = new GeminiProvider(client);
    const response = await provider.generateJSON<{ studentName: string; company: string }>({
      prompt: 'Extract fields from the message.',
    });

    assert(response.type === 'json', 'generateJSON returns standardized json response type');
    assert(response.provider === 'gemini', 'generateJSON response includes provider');
    assert(response.model === 'gemini-2.5-flash', 'generateJSON response includes model');
    assert(response.data.studentName === 'Rahul Patil', 'generateJSON parses response data');
    assert(response.data.company === 'Infosys', 'generateJSON preserves parsed fields');
  });
};

const testRetryThenSuccess = async (): Promise<void> => {
  console.log('\n--- retry behavior ---');

  await withTestEnv(async () => {
    const { client, getAttemptCount } = createMockClient(async (_params, attempt) => {
      if (attempt === 1) {
        throw new Error('Temporary Gemini outage');
      }

      return { text: 'Recovered response' };
    });

    const provider = new GeminiProvider(client);
    const response = await provider.generateText({ prompt: 'Retry me' });

    assert(getAttemptCount() === 2, 'Provider retries failed Gemini request once');
    assert(response.content === 'Recovered response', 'Provider succeeds after one retry');
  });
};

const testRetryExhausted = async (): Promise<void> => {
  await withTestEnv(async () => {
    const { client, getAttemptCount } = createMockClient(async () => {
      throw new Error('Persistent Gemini outage');
    });

    const provider = new GeminiProvider(client);

    await assertRejects(
      () => provider.generateText({ prompt: 'Fail twice' }),
      InternalServerError,
      'Provider throws after retry is exhausted',
    );
    assert(getAttemptCount() === 2, 'Provider attempts Gemini request twice before failing');
  });
};

const testNotConfigured = async (): Promise<void> => {
  console.log('\n--- configuration errors ---');

  const originalApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = '';

  try {
    const provider = new GeminiProvider();
    await assertRejects(
      () => provider.generateText({ prompt: 'No key configured' }),
      BadRequestError,
      'Provider rejects requests when GEMINI_API_KEY is missing',
    );
  } finally {
    if (originalApiKey !== undefined) {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
  }
};

const testInvalidJsonResponse = async (): Promise<void> => {
  console.log('\n--- response validation ---');

  await withTestEnv(async () => {
    const { client } = createMockClient(async () => ({
      text: 'not-json',
    }));

    const provider = new GeminiProvider(client);

    await assertRejects(
      () => provider.generateJSON({ prompt: 'Return JSON' }),
      ValidationError,
      'Provider rejects invalid JSON from Gemini',
    );
  });
};

const testEmptyResponse = async (): Promise<void> => {
  await withTestEnv(async () => {
    const { client } = createMockClient(async () => ({ text: '   ' }));

    const provider = new GeminiProvider(client);

    await assertRejects(
      () => provider.generateText({ prompt: 'Empty response' }),
      InternalServerError,
      'Provider rejects empty Gemini text responses',
    );
  });
};

const runTests = async (): Promise<void> => {
  console.log('Running GeminiProvider unit tests...');

  await testGenerateTextSuccess();
  await testGenerateJsonSuccess();
  await testRetryThenSuccess();
  await testRetryExhausted();
  await testNotConfigured();
  await testInvalidJsonResponse();
  await testEmptyResponse();

  console.log('\nAll GeminiProvider unit tests passed.');
};

runTests().catch((error) => {
  console.error('\nGeminiProvider unit tests failed:', error);
  process.exit(1);
});
