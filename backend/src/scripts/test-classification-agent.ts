/**
 * Classification Agent tests.
 *
 * Uses extracted JSON as input. Does not save to MongoDB.
 *
 * Run: npm run test:classification-agent
 */

import dotenv from 'dotenv';
import {
  CLASSIFICATION_CATEGORIES,
  CLASSIFICATION_RESULT_KEYS,
  ClassificationAgent,
  ClassificationCategory,
  GeminiProvider,
  classificationAgent,
  isGeminiConfigured,
  normalizeClassificationResult,
} from '../ai';
import { GeminiGenerativeClient } from '../ai/interfaces/gemini-client.interface';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

interface ClassificationSampleCase {
  name: string;
  extractedData: Record<string, unknown>;
  originalMessage?: string;
  expectedCategory: ClassificationCategory;
}

const SAMPLE_EXTRACTED_JSON: ClassificationSampleCase[] = [
  {
    name: 'Placement extracted JSON',
    extractedData: {
      title: 'Placement success',
      description: 'Rahul Patil secured placement at Infosys as Software Engineer.',
      categoryHint: 'Placement',
      studentNames: ['Rahul Patil'],
      facultyNames: null,
      company: 'Infosys',
      organization: null,
      eventName: null,
      eventType: null,
      achievementType: null,
      publicationTitle: null,
      patentTitle: null,
      internship: null,
      placement: 'Software Engineer',
      certificates: null,
      mediaReferences: null,
      date: '2026-07-09',
      location: null,
      confidence: 95,
    },
    originalMessage:
      'Congratulations! Rahul Patil secured placement at Infosys as Software Engineer.',
    expectedCategory: 'Placement',
  },
  {
    name: 'Internship extracted JSON',
    extractedData: {
      title: 'Internship completion',
      description: 'Ananya Deshmukh completed internship at TCS.',
      categoryHint: 'Internship',
      studentNames: ['Ananya Deshmukh'],
      facultyNames: null,
      company: 'TCS',
      organization: null,
      eventName: null,
      eventType: null,
      achievementType: null,
      publicationTitle: null,
      patentTitle: null,
      internship: 'TCS',
      placement: null,
      certificates: null,
      mediaReferences: null,
      date: '2026-06-15',
      location: 'Pune',
      confidence: 91,
    },
    expectedCategory: 'Internship',
  },
  {
    name: 'Student achievement extracted JSON',
    extractedData: {
      title: 'Sports achievement',
      description: 'Rohit Sharma led the cricket team to first prize.',
      categoryHint: 'Student Achievement',
      studentNames: ['Rohit Sharma'],
      facultyNames: null,
      company: null,
      organization: null,
      eventName: 'Inter-College Sports Meet 2026',
      eventType: null,
      achievementType: 'Sports',
      publicationTitle: null,
      patentTitle: null,
      internship: null,
      placement: null,
      certificates: null,
      mediaReferences: null,
      date: '2026-07-01',
      location: null,
      confidence: 90,
    },
    expectedCategory: 'Student Achievement',
  },
  {
    name: 'Faculty achievement extracted JSON',
    extractedData: {
      title: 'Faculty award',
      description: 'Dr. Meera Kulkarni received Best Teacher Award 2026.',
      categoryHint: 'Faculty Achievement',
      studentNames: null,
      facultyNames: ['Dr. Meera Kulkarni'],
      company: null,
      organization: 'State Education Board',
      eventName: 'Best Teacher Award 2026',
      eventType: null,
      achievementType: 'Award',
      publicationTitle: null,
      patentTitle: null,
      internship: null,
      placement: null,
      certificates: null,
      mediaReferences: null,
      date: '2026-06-20',
      location: null,
      confidence: 93,
    },
    expectedCategory: 'Faculty Achievement',
  },
  {
    name: 'Workshop extracted JSON',
    extractedData: {
      title: 'Cloud Computing workshop',
      description: 'One-day workshop on Cloud Computing for CSE students.',
      categoryHint: 'Workshop',
      studentNames: null,
      facultyNames: null,
      company: null,
      organization: null,
      eventName: 'Cloud Computing',
      eventType: 'Workshop',
      achievementType: null,
      publicationTitle: null,
      patentTitle: null,
      internship: null,
      placement: null,
      certificates: null,
      mediaReferences: null,
      date: '2026-06-20',
      location: 'Seminar Hall A',
      confidence: 94,
    },
    expectedCategory: 'Workshop',
  },
  {
    name: 'Seminar extracted JSON',
    extractedData: {
      title: 'Cyber Security seminar',
      description: 'Guest seminar on Cyber Security by Quick Heal expert.',
      categoryHint: 'Seminar',
      studentNames: null,
      facultyNames: null,
      company: null,
      organization: 'Quick Heal',
      eventName: 'Cyber Security',
      eventType: 'Seminar',
      achievementType: null,
      publicationTitle: null,
      patentTitle: null,
      internship: null,
      placement: null,
      certificates: null,
      mediaReferences: null,
      date: '2026-06-18',
      location: null,
      confidence: 92,
    },
    expectedCategory: 'Seminar',
  },
  {
    name: 'Industrial visit extracted JSON',
    extractedData: {
      title: 'Infosys industrial visit',
      description: 'Third-year students visited Infosys Development Center.',
      categoryHint: 'Industrial Visit',
      studentNames: null,
      facultyNames: null,
      company: 'Infosys',
      organization: null,
      eventName: 'Industrial Visit',
      eventType: 'Industrial Visit',
      achievementType: null,
      publicationTitle: null,
      patentTitle: null,
      internship: null,
      placement: null,
      certificates: null,
      mediaReferences: null,
      date: '2026-06-10',
      location: 'Pune',
      confidence: 96,
    },
    expectedCategory: 'Industrial Visit',
  },
  {
    name: 'Publication extracted JSON',
    extractedData: {
      title: 'Faculty publication',
      description: 'Dr. Meera Kulkarni published a research paper in IEEE Access.',
      categoryHint: 'Publication',
      studentNames: null,
      facultyNames: ['Dr. Meera Kulkarni'],
      company: null,
      organization: 'IEEE Access',
      eventName: null,
      eventType: null,
      achievementType: null,
      publicationTitle: 'Edge AI for Smart Campus Systems',
      patentTitle: null,
      internship: null,
      placement: null,
      certificates: null,
      mediaReferences: null,
      date: '2026-07-03',
      location: null,
      confidence: 97,
    },
    expectedCategory: 'Publication',
  },
  {
    name: 'Patent extracted JSON',
    extractedData: {
      title: 'Patent filing',
      description: 'Patent filed for Smart Attendance Monitoring System.',
      categoryHint: 'Patent',
      studentNames: null,
      facultyNames: ['Prof. Ajay Naik', 'Prof. Sunita Rao'],
      company: null,
      organization: null,
      eventName: null,
      eventType: null,
      achievementType: null,
      publicationTitle: null,
      patentTitle: 'Smart Attendance Monitoring System',
      internship: null,
      placement: null,
      certificates: null,
      mediaReferences: null,
      date: '2026-05-30',
      location: null,
      confidence: 95,
    },
    expectedCategory: 'Patent',
  },
  {
    name: 'Other extracted JSON',
    extractedData: {
      title: 'Department notice',
      description: 'Reminder to submit attendance sheets by Friday.',
      categoryHint: null,
      studentNames: null,
      facultyNames: null,
      company: null,
      organization: null,
      eventName: null,
      eventType: null,
      achievementType: null,
      publicationTitle: null,
      patentTitle: null,
      internship: null,
      placement: null,
      certificates: null,
      mediaReferences: null,
      date: '2026-07-08',
      location: null,
      confidence: 60,
    },
    expectedCategory: 'Other',
  },
  {
    name: 'Certification mapped to student achievement',
    extractedData: {
      title: 'AWS certification',
      description: 'Sneha Patil completed AWS Cloud Practitioner certification.',
      categoryHint: 'Certification',
      studentNames: ['Sneha Patil'],
      facultyNames: null,
      company: null,
      organization: 'Amazon Web Services',
      eventName: null,
      eventType: null,
      achievementType: 'Certification',
      publicationTitle: null,
      patentTitle: null,
      internship: null,
      placement: null,
      certificates: ['AWS Cloud Practitioner'],
      mediaReferences: null,
      date: '2026-06-25',
      location: null,
      confidence: 88,
    },
    expectedCategory: 'Student Achievement',
  },
];

const assertClassificationShape = (result: Record<string, unknown>): void => {
  for (const key of CLASSIFICATION_RESULT_KEYS) {
    assert(Object.prototype.hasOwnProperty.call(result, key), `Classification result includes ${key}`);
  }

  assert(
    CLASSIFICATION_CATEGORIES.includes(result.category as ClassificationCategory),
    'Category is one of the allowed values',
  );
  assert(
    result.confidence === null || typeof result.confidence === 'number',
    'Confidence is null or a number',
  );
  assert(
    result.reasoning === null || typeof result.reasoning === 'string',
    'Reasoning is null or a string',
  );
};

const testNormalization = (): void => {
  console.log('\n--- Classification normalization ---');

  const normalized = normalizeClassificationResult({
    category: 'Placement',
    confidence: 94,
    reasoning: 'The extracted data references a student placement at Infosys.',
  });

  assert(normalized.category === 'Placement', 'Normalized category is preserved');
  assert(normalized.confidence === 94, 'Normalized confidence is preserved');
  assert(Boolean(normalized.reasoning), 'Normalized reasoning is preserved');
};

const testMockedAgent = async (): Promise<void> => {
  console.log('\n--- Mocked classification agent ---');

  const mockClient: GeminiGenerativeClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          category: 'Workshop',
          confidence: 93,
          reasoning: 'The extracted data describes a workshop event.',
        }),
      }),
    },
  };

  const provider = new GeminiProvider(mockClient);
  const agent = new ClassificationAgent(provider);
  const response = await agent.classify({
    extractedData: SAMPLE_EXTRACTED_JSON[4].extractedData,
    originalMessage: 'One-day workshop on Cloud Computing was conducted.',
  });

  assert(response.provider === 'gemini', 'Mocked agent response includes provider');
  assert(response.result.category === 'Workshop', 'Mocked agent returns expected category');
  assert(response.result.confidence === 93, 'Mocked agent returns confidence score');
  assert(Boolean(response.result.reasoning), 'Mocked agent returns reasoning');
};

const testLiveClassification = async (): Promise<void> => {
  console.log('\n--- Live Gemini classification ---');

  if (!isGeminiConfigured()) {
    console.log('SKIP: GEMINI_API_KEY is not configured for live classification tests');
    return;
  }

  assert(SAMPLE_EXTRACTED_JSON.length >= 10, 'At least ten extracted JSON samples are defined');

  for (const sample of SAMPLE_EXTRACTED_JSON) {
    const response = await classificationAgent.classify({
      extractedData: sample.extractedData,
      originalMessage: sample.originalMessage,
    });

    assertClassificationShape(response.result as unknown as Record<string, unknown>);
    assert(
      response.result.category === sample.expectedCategory,
      `${sample.name}: category is ${sample.expectedCategory}`,
    );
    assert(typeof response.model === 'string', `${sample.name}: response includes model name`);
    assert(response.provider === 'gemini', `${sample.name}: response provider is gemini`);
    assert(Boolean(response.result.reasoning), `${sample.name}: reasoning is provided`);

    console.log(`PASS: ${sample.name} classified successfully`);
  }
};

const runTests = async (): Promise<void> => {
  console.log('Running Classification Agent tests...');

  testNormalization();
  await testMockedAgent();
  await testLiveClassification();

  console.log('\nAll Classification Agent tests passed.');
};

runTests().catch((error) => {
  console.error('\nClassification Agent tests failed:', error);
  process.exit(1);
});
