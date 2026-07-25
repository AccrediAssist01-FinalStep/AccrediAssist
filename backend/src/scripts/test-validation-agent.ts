/**
 * Validation Agent tests.
 *
 * Uses extracted JSON as input. Does not save records to MongoDB.
 *
 * Run: npm run test:validation-agent
 */

import dotenv from 'dotenv';
import {
  VALIDATION_ERROR_CODES,
  VALIDATION_RESULT_KEYS,
  VALIDATION_STATUSES,
  ValidationAgent,
  ValidationErrorCode,
  ValidationStatus,
  GeminiProvider,
  hasValidationErrorCode,
  isGeminiConfigured,
  normalizeValidationResult,
  validationAgent,
} from '../ai';
import { GeminiGenerativeClient } from '../ai/interfaces/gemini-client.interface';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

interface ValidationSampleCase {
  name: string;
  category: string;
  extractedData: Record<string, unknown>;
  originalMessage?: string;
  existingTitles?: string[];
  expectedStatus: ValidationStatus;
  expectedErrorCodes?: ValidationErrorCode[];
}

const SAMPLE_VALIDATION_CASES: ValidationSampleCase[] = [
  {
    name: 'Valid placement record',
    category: 'Placement',
    extractedData: {
      title: 'Placement success',
      description: 'Rahul Patil secured placement at Infosys as Software Engineer.',
      studentNames: ['Rahul Patil'],
      company: 'Infosys',
      placement: 'Software Engineer',
      date: '2026-07-09',
    },
    originalMessage:
      'Congratulations! Rahul Patil secured placement at Infosys as Software Engineer.',
    expectedStatus: 'valid',
  },
  {
    name: 'Missing required student name',
    category: 'Placement',
    extractedData: {
      title: 'Placement update',
      description: 'Placement at Infosys as Software Engineer.',
      studentNames: null,
      company: 'Infosys',
      placement: 'Software Engineer',
      date: '2026-07-09',
    },
    expectedStatus: 'invalid',
    expectedErrorCodes: ['required_field', 'missing_information'],
  },
  {
    name: 'Invalid date format',
    category: 'Internship',
    extractedData: {
      title: 'Internship completion',
      studentNames: ['Ananya Deshmukh'],
      company: 'TCS',
      internship: 'TCS',
      date: '32 June 2026',
    },
    expectedStatus: 'invalid',
    expectedErrorCodes: ['invalid_date'],
  },
  {
    name: 'Invalid company placeholder',
    category: 'Placement',
    extractedData: {
      title: 'Placement update',
      studentNames: ['Karan Mehta'],
      company: 'N/A',
      placement: 'Analyst',
      date: '2026-07-01',
    },
    expectedStatus: 'invalid',
    expectedErrorCodes: ['invalid_company'],
  },
  {
    name: 'Duplicate title detected',
    category: 'Workshop',
    extractedData: {
      title: 'Cloud Computing Workshop',
      eventName: 'Cloud Computing Workshop',
      eventType: 'Workshop',
      date: '2026-06-20',
      location: 'Seminar Hall A',
      description: 'One-day workshop on Cloud Computing.',
    },
    existingTitles: ['Cloud Computing Workshop', 'Cyber Security Seminar'],
    expectedStatus: 'invalid',
    expectedErrorCodes: ['duplicate_title'],
  },
  {
    name: 'Missing publication title',
    category: 'Publication',
    extractedData: {
      title: 'Faculty publication',
      facultyNames: ['Dr. Meera Kulkarni'],
      publicationTitle: null,
      date: '2026-07-03',
      organization: 'IEEE Access',
    },
    expectedStatus: 'invalid',
    expectedErrorCodes: ['required_field', 'missing_information'],
  },
  {
    name: 'Missing industrial visit location information',
    category: 'Industrial Visit',
    extractedData: {
      title: 'Industrial visit',
      company: 'Infosys',
      date: '2026-06-10',
      location: null,
      description: null,
    },
    expectedStatus: 'invalid',
    expectedErrorCodes: ['missing_information', 'required_field'],
  },
  {
    name: 'Invalid impossible date',
    category: 'Seminar',
    extractedData: {
      title: 'Cyber Security Seminar',
      eventName: 'Cyber Security Seminar',
      eventType: 'Seminar',
      date: '2026-13-40',
      organization: 'Quick Heal',
    },
    expectedStatus: 'invalid',
    expectedErrorCodes: ['invalid_date'],
  },
  {
    name: 'Duplicate patent title',
    category: 'Patent',
    extractedData: {
      title: 'Smart Attendance Monitoring System',
      patentTitle: 'Smart Attendance Monitoring System',
      facultyNames: ['Prof. Ajay Naik'],
      date: '2026-05-30',
    },
    existingTitles: ['Smart Attendance Monitoring System'],
    expectedStatus: 'invalid',
    expectedErrorCodes: ['duplicate_title'],
  },
  {
    name: 'Valid faculty achievement',
    category: 'Faculty Achievement',
    extractedData: {
      title: 'Best Teacher Award 2026',
      facultyNames: ['Dr. Meera Kulkarni'],
      description: 'Dr. Meera Kulkarni received Best Teacher Award 2026.',
      date: '2026-06-20',
      organization: 'State Education Board',
    },
    expectedStatus: 'valid',
  },
  {
    name: 'Sparse other record missing information',
    category: 'Other',
    extractedData: {
      title: 'Department notice',
      description: null,
      date: null,
    },
    expectedStatus: 'invalid',
    expectedErrorCodes: ['missing_information'],
  },
];

const assertValidationShape = (result: Record<string, unknown>): void => {
  for (const key of VALIDATION_RESULT_KEYS) {
    assert(Object.prototype.hasOwnProperty.call(result, key), `Validation result includes ${key}`);
  }

  assert(
    VALIDATION_STATUSES.includes(result.validationStatus as ValidationStatus),
    'Validation status is valid or invalid',
  );
  assert(Array.isArray(result.validationErrors), 'Validation errors is an array');

  for (const issue of result.validationErrors as Array<Record<string, unknown>>) {
    assert(
      VALIDATION_ERROR_CODES.includes(issue.code as ValidationErrorCode),
      'Validation issue code is allowed',
    );
    assert(typeof issue.message === 'string', 'Validation issue message is a string');
  }
};

const assertExpectedValidation = (
  sampleName: string,
  result: ReturnType<typeof normalizeValidationResult>,
  expectedStatus: ValidationStatus,
  expectedErrorCodes?: ValidationErrorCode[],
): void => {
  assert(
    result.validationStatus === expectedStatus,
    `${sampleName}: validation status is ${expectedStatus}`,
  );

  if (expectedStatus === 'valid') {
    assert(result.validationErrors.length === 0, `${sampleName}: valid records have no errors`);
    return;
  }

  assert(result.validationErrors.length > 0, `${sampleName}: invalid records include errors`);

  if (expectedErrorCodes?.length) {
    assert(
      expectedErrorCodes.some((code) => hasValidationErrorCode(result.validationErrors, code)),
      `${sampleName}: includes expected validation error code`,
    );
  }
};

const testNormalization = (): void => {
  console.log('\n--- Validation normalization ---');

  const valid = normalizeValidationResult({
    validationStatus: 'valid',
    validationErrors: [],
  });
  assert(valid.validationStatus === 'valid', 'Valid normalization preserves valid status');

  const invalid = normalizeValidationResult({
    validationStatus: 'invalid',
    validationErrors: [
      {
        code: 'required_field',
        field: 'studentNames',
        message: 'Student name is required for placement records.',
      },
    ],
  });
  assert(invalid.validationErrors.length === 1, 'Invalid normalization preserves validation errors');
  assert(
    hasValidationErrorCode(invalid.validationErrors, 'required_field'),
    'Normalized errors retain error codes',
  );
};

const testMockedAgent = async (): Promise<void> => {
  console.log('\n--- Mocked validation agent ---');

  const mockClient: GeminiGenerativeClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          validationStatus: 'invalid',
          validationErrors: [
            {
              code: 'duplicate_title',
              field: 'title',
              message: 'Title matches an existing record.',
            },
          ],
        }),
      }),
    },
  };

  const provider = new GeminiProvider(mockClient);
  const agent = new ValidationAgent(provider);
  const response = await agent.validate({
    category: 'Workshop',
    extractedData: SAMPLE_VALIDATION_CASES[4].extractedData,
    existingTitles: ['Cloud Computing Workshop'],
  });

  assert(response.provider === 'gemini', 'Mocked agent response includes provider');
  assert(response.result.validationStatus === 'invalid', 'Mocked agent returns invalid status');
  assert(
    hasValidationErrorCode(response.result.validationErrors, 'duplicate_title'),
    'Mocked agent returns duplicate title error',
  );
};

const testLiveValidation = async (): Promise<void> => {
  console.log('\n--- Live Gemini validation ---');

  if (!isGeminiConfigured()) {
    console.log('SKIP: GEMINI_API_KEY is not configured for live validation tests');
    return;
  }

  assert(SAMPLE_VALIDATION_CASES.length >= 10, 'At least ten validation samples are defined');

  for (const sample of SAMPLE_VALIDATION_CASES) {
    const response = await validationAgent.validate({
      category: sample.category,
      extractedData: sample.extractedData,
      originalMessage: sample.originalMessage,
      existingTitles: sample.existingTitles,
    });

    assertValidationShape(response.result as unknown as Record<string, unknown>);
    assertExpectedValidation(
      sample.name,
      response.result,
      sample.expectedStatus,
      sample.expectedErrorCodes,
    );
    assert(typeof response.model === 'string', `${sample.name}: response includes model name`);
    assert(response.provider === 'gemini', `${sample.name}: response provider is gemini`);

    console.log(`PASS: ${sample.name} validated successfully`);
  }
};

const runTests = async (): Promise<void> => {
  console.log('Running Validation Agent tests...');

  testNormalization();
  await testMockedAgent();
  await testLiveValidation();

  console.log('\nAll Validation Agent tests passed.');
};

runTests().catch((error) => {
  console.error('\nValidation Agent tests failed:', error);
  process.exit(1);
});
