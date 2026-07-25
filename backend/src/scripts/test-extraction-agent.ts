/**
 * Information Extraction Agent tests.
 *
 * Runs mocked unit tests and live Gemini extraction tests when configured.
 *
 * Run: npm run test:extraction-agent
 */

import dotenv from 'dotenv';
import {
  EXTRACTION_RESULT_KEYS,
  ExtractionAgent,
  GeminiProvider,
  extractionAgent,
  isGeminiConfigured,
  normalizeExtractionResult,
} from '../ai';
import { GeminiGenerativeClient } from '../ai/interfaces/gemini-client.interface';
import { WhatsAppIncomingMessage } from '../whatsapp/types';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

interface SampleMessageCase {
  name: string;
  message: WhatsAppIncomingMessage;
  expectedContains?: Partial<{
    studentNames: string[];
    facultyNames: string[];
    company: string;
    organization: string;
    eventName: string;
    eventType: string;
    achievementType: string;
    publicationTitle: string;
    patentTitle: string;
    internship: string;
    placement: string;
    categoryHint: string;
    location: string;
  }>;
}

const createSampleMessage = (
  message: string,
  overrides: Partial<WhatsAppIncomingMessage> = {},
): WhatsAppIncomingMessage => ({
  groupName: 'Computer Department',
  sender: 'Faculty Member',
  message,
  timestamp: new Date('2026-07-09T10:00:00.000Z'),
  media: null,
  mediaMetadata: null,
  ...overrides,
});

const SAMPLE_MESSAGES: SampleMessageCase[] = [
  {
    name: 'Placement announcement',
    message: createSampleMessage(
      'Congratulations! Rahul Patil secured placement at Infosys as Software Engineer with package 6 LPA.',
      { groupName: 'Training & Placement', sender: 'Placement Officer' },
    ),
    expectedContains: {
      studentNames: ['Rahul Patil'],
      company: 'Infosys',
      placement: 'Software Engineer',
      categoryHint: 'Placement',
    },
  },
  {
    name: 'Internship completion',
    message: createSampleMessage(
      'Ananya Deshmukh completed a 2-month internship at TCS in Pune on 15 June 2026.',
      { groupName: 'Training & Placement' },
    ),
    expectedContains: {
      studentNames: ['Ananya Deshmukh'],
      company: 'TCS',
      internship: 'TCS',
      location: 'Pune',
    },
  },
  {
    name: 'Sports achievement',
    message: createSampleMessage(
      'Team captain Rohit Sharma led the college cricket team to first prize in the Inter-College Sports Meet 2026.',
      { groupName: 'Student Achievements' },
    ),
    expectedContains: {
      studentNames: ['Rohit Sharma'],
      achievementType: 'Sports',
      eventName: 'Inter-College Sports Meet 2026',
    },
  },
  {
    name: 'Faculty publication',
    message: createSampleMessage(
      'Dr. Meera Kulkarni published the paper "Edge AI for Smart Campus Systems" in IEEE Access on 3 July 2026.',
      { groupName: 'Faculty Updates' },
    ),
    expectedContains: {
      facultyNames: ['Dr. Meera Kulkarni'],
      publicationTitle: 'Edge AI for Smart Campus Systems',
    },
  },
  {
    name: 'Workshop report',
    message: createSampleMessage(
      'One-day workshop on Cloud Computing was conducted on 20 June 2026 at Seminar Hall A for CSE students.',
      { groupName: 'Computer Department' },
    ),
    expectedContains: {
      eventName: 'Cloud Computing',
      eventType: 'Workshop',
      location: 'Seminar Hall A',
    },
  },
  {
    name: 'Guest seminar',
    message: createSampleMessage(
      'Guest seminar on Cyber Security by expert from Quick Heal was organized on 18 June 2026.',
      { groupName: 'Computer Department' },
    ),
    expectedContains: {
      eventType: 'Seminar',
      organization: 'Quick Heal',
    },
  },
  {
    name: 'Industrial visit',
    message: createSampleMessage(
      'Third-year students visited Infosys Development Center, Pune on 10 June 2026 as part of an industrial visit.',
      { groupName: 'Computer Department' },
    ),
    expectedContains: {
      company: 'Infosys',
      eventType: 'Industrial Visit',
      location: 'Pune',
    },
  },
  {
    name: 'Patent filing',
    message: createSampleMessage(
      'Patent filed: Smart Attendance Monitoring System. Inventors: Prof. Ajay Naik and Prof. Sunita Rao.',
      { groupName: 'Faculty Updates' },
    ),
    expectedContains: {
      patentTitle: 'Smart Attendance Monitoring System',
      facultyNames: ['Prof. Ajay Naik'],
    },
  },
  {
    name: 'Certification achievement',
    message: createSampleMessage(
      'Sneha Patil completed AWS Cloud Practitioner certification from Amazon Web Services.',
      { groupName: 'Student Achievements' },
    ),
    expectedContains: {
      studentNames: ['Sneha Patil'],
      achievementType: 'Certification',
      organization: 'Amazon Web Services',
    },
  },
  {
    name: 'Cultural event',
    message: createSampleMessage(
      'Department cultural fest "TechRhythm 2026" was held on 5 July 2026 at Open Air Theatre.',
      { groupName: 'Student Achievements' },
    ),
    expectedContains: {
      eventName: 'TechRhythm 2026',
      achievementType: 'Cultural',
      location: 'Open Air Theatre',
    },
  },
  {
    name: 'Multiple placement recipients',
    message: createSampleMessage(
      'Placement update: Aisha Khan joined Wipro as Graduate Engineer Trainee and Karan Mehta joined Capgemini as Analyst.',
      { groupName: 'Training & Placement' },
    ),
    expectedContains: {
      studentNames: ['Aisha Khan', 'Karan Mehta'],
      company: 'Wipro',
    },
  },
  {
    name: 'Message with media reference',
    message: createSampleMessage(
      'Certificate attached for hackathon winners.',
      {
        groupName: 'Student Achievements',
        media: 'https://res.cloudinary.com/demo/image/upload/v1/certificate.jpg',
        mediaMetadata: {
          mediaType: 'image',
          mimeType: 'image/jpeg',
          fileName: 'certificate.jpg',
          fileSize: 120000,
          tempFileId: 'temp-001',
          downloadedAt: new Date('2026-07-09T10:00:00.000Z'),
          secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/certificate.jpg',
        },
      },
    ),
    expectedContains: {
      certificates: ['certificate'],
    },
  },
];

const containsMatch = (actual: string | null | undefined, expected: string): boolean => {
  if (!actual) {
    return false;
  }

  return actual.toLowerCase().includes(expected.toLowerCase());
};

const containsAnyName = (actual: string[] | null | undefined, expectedNames: string[]): boolean => {
  if (!actual || actual.length === 0) {
    return false;
  }

  return expectedNames.some((expectedName) =>
    actual.some((actualName) => actualName.toLowerCase().includes(expectedName.toLowerCase())),
  );
};

const assertExtractionShape = (result: Record<string, unknown>): void => {
  for (const key of EXTRACTION_RESULT_KEYS) {
    assert(Object.prototype.hasOwnProperty.call(result, key), `Extraction result includes ${key}`);
  }

  assert(
    result.confidence === null || typeof result.confidence === 'number',
    'Confidence is null or a number',
  );
};

const assertExpectedFields = (
  sampleName: string,
  result: ReturnType<typeof normalizeExtractionResult>,
  expected?: SampleMessageCase['expectedContains'],
): void => {
  if (!expected) {
    return;
  }

  if (expected.studentNames) {
    assert(
      containsAnyName(result.studentNames, expected.studentNames),
      `${sampleName}: extracted student names match expected values`,
    );
  }

  if (expected.facultyNames) {
    assert(
      containsAnyName(result.facultyNames, expected.facultyNames),
      `${sampleName}: extracted faculty names match expected values`,
    );
  }

  if (expected.company) {
    assert(
      containsMatch(result.company, expected.company),
      `${sampleName}: extracted company matches expected value`,
    );
  }

  if (expected.organization) {
    assert(
      containsMatch(result.organization, expected.organization),
      `${sampleName}: extracted organization matches expected value`,
    );
  }

  if (expected.eventName) {
    assert(
      containsMatch(result.eventName, expected.eventName) ||
        containsMatch(result.title, expected.eventName),
      `${sampleName}: extracted event name matches expected value`,
    );
  }

  if (expected.eventType) {
    assert(
      containsMatch(result.eventType, expected.eventType) ||
        containsMatch(result.categoryHint, expected.eventType),
      `${sampleName}: extracted event type matches expected value`,
    );
  }

  if (expected.achievementType) {
    assert(
      containsMatch(result.achievementType, expected.achievementType) ||
        containsMatch(result.categoryHint, expected.achievementType),
      `${sampleName}: extracted achievement type matches expected value`,
    );
  }

  if (expected.publicationTitle) {
    assert(
      containsMatch(result.publicationTitle, expected.publicationTitle),
      `${sampleName}: extracted publication title matches expected value`,
    );
  }

  if (expected.patentTitle) {
    assert(
      containsMatch(result.patentTitle, expected.patentTitle),
      `${sampleName}: extracted patent title matches expected value`,
    );
  }

  if (expected.internship) {
    assert(
      containsMatch(result.internship, expected.internship) ||
        containsMatch(result.company, expected.internship),
      `${sampleName}: extracted internship matches expected value`,
    );
  }

  if (expected.placement) {
    assert(
      containsMatch(result.placement, expected.placement) ||
        containsMatch(result.description, expected.placement),
      `${sampleName}: extracted placement matches expected value`,
    );
  }

  if (expected.categoryHint) {
    assert(
      containsMatch(result.categoryHint, expected.categoryHint),
      `${sampleName}: extracted category hint matches expected value`,
    );
  }

  if (expected.location) {
    assert(
      containsMatch(result.location, expected.location),
      `${sampleName}: extracted location matches expected value`,
    );
  }

  if (expected.certificates) {
    const certificateText = (result.certificates ?? []).join(' ').toLowerCase();
    assert(
      expected.certificates.some((value) => certificateText.includes(value.toLowerCase())) ||
        Boolean(result.mediaReferences?.length),
      `${sampleName}: certificate or media reference is captured`,
    );
  }
};

const testNormalization = (): void => {
  console.log('\n--- Extraction normalization ---');

  const normalized = normalizeExtractionResult({
    title: 'Placement update',
    description: '',
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
    certificates: [],
    mediaReferences: ['https://example.com/file.jpg'],
    date: '2026-07-09',
    location: null,
    confidence: 92,
  });

  assert(normalized.description === null, 'Empty strings are normalized to null');
  assert(normalized.certificates === null, 'Empty arrays are normalized to null');
  assert(normalized.studentNames?.[0] === 'Rahul Patil', 'Student names are preserved');
  assert(normalized.confidence === 92, 'Confidence score is preserved');
};

const testMockedAgent = async (): Promise<void> => {
  console.log('\n--- Mocked extraction agent ---');

  const mockClient: GeminiGenerativeClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          title: 'Placement success',
          description: 'Rahul Patil secured placement at Infosys.',
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
        }),
      }),
    },
  };

  const provider = new GeminiProvider(mockClient);
  const agent = new ExtractionAgent(provider);
  const response = await agent.extract(
    createSampleMessage('Rahul Patil secured placement at Infosys as Software Engineer.'),
  );

  assert(response.provider === 'gemini', 'Mocked agent response includes provider');
  assert(response.result.company === 'Infosys', 'Mocked agent returns parsed company');
  assert(response.result.confidence === 95, 'Mocked agent returns confidence score');
};

const testLiveExtraction = async (): Promise<void> => {
  console.log('\n--- Live Gemini extraction ---');

  if (!isGeminiConfigured()) {
    console.log('SKIP: GEMINI_API_KEY is not configured for live extraction tests');
    return;
  }

  assert(SAMPLE_MESSAGES.length >= 10, 'At least ten sample WhatsApp messages are defined');

  for (const sample of SAMPLE_MESSAGES) {
    const response = await extractionAgent.extract(sample.message);

    assertExtractionShape(response.result as unknown as Record<string, unknown>);
    assert(typeof response.model === 'string', `${sample.name}: response includes model name`);
    assert(response.provider === 'gemini', `${sample.name}: response provider is gemini`);
    assertExpectedFields(sample.name, response.result, sample.expectedContains);

    console.log(`PASS: ${sample.name} extracted successfully`);
  }
};

const runTests = async (): Promise<void> => {
  console.log('Running Information Extraction Agent tests...');

  testNormalization();
  await testMockedAgent();
  await testLiveExtraction();

  console.log('\nAll Information Extraction Agent tests passed.');
};

runTests().catch((error) => {
  console.error('\nInformation Extraction Agent tests failed:', error);
  process.exit(1);
});
