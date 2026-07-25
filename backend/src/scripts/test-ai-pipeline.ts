/**
 * End-to-end AI pipeline tests.
 *
 * Flow:
 * WhatsApp Message -> Extraction -> Classification -> Validation ->
 * Duplicate Detection -> PendingRecord
 *
 * Run: npm run test:ai-pipeline
 */

import dotenv from 'dotenv';
import {
  AiPipelineService,
  ExtractionAgent,
  GeminiProvider,
  ValidationAgent,
  ClassificationAgent,
  DuplicateDetectionAgent,
  aiPipelineService,
  isGeminiConfigured,
  mapClassificationToRecordCategory,
  resolvePendingRecordStatus,
} from '../ai';
import { ExtractionResult } from '../ai/interfaces/extraction.interface';
import { GeminiGenerativeClient } from '../ai/interfaces/gemini-client.interface';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { Placement } from '../models/Placement';
import { WhatsAppIncomingMessage } from '../whatsapp/types';

dotenv.config();

const TEST_PREFIX = 'PIPELINE_TEST_';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const createWhatsAppMessage = (
  message: string,
  overrides: Partial<WhatsAppIncomingMessage> = {},
): WhatsAppIncomingMessage => ({
  groupName: 'Training & Placement',
  sender: 'Placement Officer',
  message,
  timestamp: new Date('2026-07-09T10:00:00.000Z'),
  media: null,
  mediaMetadata: null,
  ...overrides,
});

const SAMPLE_MESSAGES: WhatsAppIncomingMessage[] = [
  createWhatsAppMessage(
    `${TEST_PREFIX}Congratulations! Rahul Patil secured placement at Infosys as Software Engineer.`,
  ),
  createWhatsAppMessage(
    `${TEST_PREFIX}Ananya Deshmukh completed internship at TCS in Pune on 15 June 2026.`,
    { groupName: 'Computer Department', sender: 'Faculty Member' },
  ),
  createWhatsAppMessage(
    `${TEST_PREFIX}One-day workshop on Cloud Computing was conducted on 20 June 2026 at Seminar Hall A.`,
    { groupName: 'Computer Department' },
  ),
  createWhatsAppMessage(`${TEST_PREFIX}Reminder to submit attendance sheets by Friday.`),
  createWhatsAppMessage(
    `${TEST_PREFIX}Dr. Meera Kulkarni published Edge AI for Smart Campus Systems in IEEE Access.`,
    { groupName: 'Faculty Updates', sender: 'Research Cell' },
  ),
  createWhatsAppMessage(
    `${TEST_PREFIX}Patent filed: Smart Attendance Monitoring System by Prof. Ajay Naik.`,
    { groupName: 'Faculty Updates' },
  ),
];

const extractionFixtures: Record<string, ExtractionResult> = {
  placement: {
    title: 'Placement success',
    description: 'Rahul Patil secured placement at Infosys.',
    categoryHint: 'Placement',
    studentNames: [`${TEST_PREFIX}Rahul Patil`],
    facultyNames: null,
    company: `${TEST_PREFIX}Infosys`,
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
  internship: {
    title: 'Internship completion',
    description: 'Ananya Deshmukh completed internship at TCS.',
    categoryHint: 'Internship',
    studentNames: [`${TEST_PREFIX}Ananya Deshmukh`],
    facultyNames: null,
    company: `${TEST_PREFIX}TCS`,
    organization: null,
    eventName: null,
    eventType: null,
    achievementType: null,
    publicationTitle: null,
    patentTitle: null,
    internship: `${TEST_PREFIX}TCS`,
    placement: null,
    certificates: null,
    mediaReferences: null,
    date: '2026-06-15',
    location: 'Pune',
    confidence: 91,
  },
  workshop: {
    title: 'Cloud Computing workshop',
    description: 'Workshop on Cloud Computing.',
    categoryHint: 'Workshop',
    studentNames: null,
    facultyNames: null,
    company: null,
    organization: null,
    eventName: `${TEST_PREFIX}Cloud Computing Workshop`,
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
    confidence: 93,
  },
  sparse: {
    title: `${TEST_PREFIX}Department notice`,
    description: null,
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
    date: null,
    location: null,
    confidence: 55,
  },
  publication: {
    title: 'Faculty publication',
    description: 'Dr. Meera Kulkarni published a paper.',
    categoryHint: 'Publication',
    studentNames: null,
    facultyNames: [`${TEST_PREFIX}Dr. Meera Kulkarni`],
    company: null,
    organization: `${TEST_PREFIX}IEEE Access`,
    eventName: null,
    eventType: null,
    achievementType: null,
    publicationTitle: `${TEST_PREFIX}Edge AI for Smart Campus Systems`,
    patentTitle: null,
    internship: null,
    placement: null,
    certificates: null,
    mediaReferences: null,
    date: '2026-07-03',
    location: null,
    confidence: 96,
  },
  patent: {
    title: 'Patent filing',
    description: 'Patent filed for Smart Attendance Monitoring System.',
    categoryHint: 'Patent',
    studentNames: null,
    facultyNames: [`${TEST_PREFIX}Prof. Ajay Naik`],
    company: null,
    organization: null,
    eventName: null,
    eventType: null,
    achievementType: null,
    publicationTitle: null,
    patentTitle: `${TEST_PREFIX}Smart Attendance Monitoring System`,
    internship: null,
    placement: null,
    certificates: null,
    mediaReferences: null,
    date: '2026-05-30',
    location: null,
    confidence: 94,
  },
};

const resolveFixtureKey = (message: WhatsAppIncomingMessage): keyof typeof extractionFixtures => {
  if (message.message.includes('placement')) return 'placement';
  if (message.message.includes('internship')) return 'internship';
  if (message.message.includes('workshop')) return 'workshop';
  if (message.message.includes('attendance')) return 'sparse';
  if (message.message.includes('published')) return 'publication';
  if (message.message.includes('Patent filed')) return 'patent';
  return 'sparse';
};

const createMockGeminiClient = (
  handler: (prompt: string) => Record<string, unknown>,
): GeminiGenerativeClient => ({
  models: {
    generateContent: async ({ contents }) => ({
      text: JSON.stringify(handler(String(contents))),
    }),
  },
});

const createMockedPipeline = (): AiPipelineService => {
  const provider = new GeminiProvider(
    createMockGeminiClient((prompt) => {
      if (prompt.includes('Extract structured information')) {
        const message = SAMPLE_MESSAGES.find((item) => prompt.includes(item.message)) ?? SAMPLE_MESSAGES[0];
        return extractionFixtures[resolveFixtureKey(message)] as unknown as Record<string, unknown>;
      }

      if (prompt.includes('Classify the extracted institutional record')) {
        if (prompt.includes('internship')) {
          return { category: 'Internship', confidence: 92, reasoning: 'Internship record.' };
        }
        if (prompt.includes('workshop') || prompt.includes('Cloud Computing')) {
          return { category: 'Workshop', confidence: 93, reasoning: 'Workshop record.' };
        }
        if (prompt.includes('attendance')) {
          return { category: 'Other', confidence: 60, reasoning: 'General notice.' };
        }
        if (prompt.includes('published') || prompt.includes('IEEE Access')) {
          return { category: 'Publication', confidence: 95, reasoning: 'Publication record.' };
        }
        if (prompt.includes('Patent filed')) {
          return { category: 'Patent', confidence: 94, reasoning: 'Patent record.' };
        }
        return { category: 'Placement', confidence: 94, reasoning: 'Placement record.' };
      }

      if (prompt.includes('Validate the extracted institutional record')) {
        if (prompt.includes('attendance')) {
          return {
            validationStatus: 'invalid',
            validationErrors: [
              {
                code: 'missing_information',
                field: 'description',
                message: 'Record lacks institutional event details.',
              },
            ],
          };
        }

        return { validationStatus: 'valid', validationErrors: [] };
      }

      return {};
    }),
  );

  return new AiPipelineService(
    new ExtractionAgent(provider),
    new ClassificationAgent(provider),
    new ValidationAgent(provider),
    new DuplicateDetectionAgent(),
  );
};

const cleanupPipelineTestData = async (): Promise<void> => {
  await PendingRecord.deleteMany({ originalMessage: new RegExp(TEST_PREFIX) });
  await Placement.deleteMany({ studentName: new RegExp(`^${TEST_PREFIX}`) });
};

const testPipelineUtilities = (): void => {
  console.log('\n--- Pipeline utilities ---');

  const category = mapClassificationToRecordCategory('Placement', extractionFixtures.placement);
  assert(category === 'Placement', 'Classification category maps to pending record category');

  const needsReview = resolvePendingRecordStatus({
    validation: {
      validationStatus: 'invalid',
      validationErrors: [
        { code: 'missing_information', field: 'description', message: 'Missing details.' },
      ],
    },
    duplicateDetection: { duplicate: false, similarityScore: 0, matchingRecordId: null },
    confidenceScore: 90,
  });
  assert(needsReview === 'Needs Review', 'Invalid validation resolves to Needs Review');
};

const testMockedPipeline = async (): Promise<void> => {
  console.log('\n--- Mocked AI pipeline ---');

  const pipeline = createMockedPipeline();
  const placementCountBefore = await Placement.countDocuments();
  const results = [];

  for (const message of SAMPLE_MESSAGES) {
    results.push(await pipeline.processWhatsAppMessage(message));
  }

  assert(results.length === SAMPLE_MESSAGES.length, 'Pipeline processed all sample WhatsApp messages');
  assert(
    results.every((result) => Boolean(result.pendingRecord._id)),
    'Each pipeline run creates a PendingRecord',
  );
  assert(
    results.every((result) => result.stages.extraction.result.title),
    'Each pipeline result includes extraction output',
  );
  assert(
    results.every((result) => result.stages.classification.result.category),
    'Each pipeline result includes classification output',
  );
  assert(
    results.every((result) => result.stages.validation.result.validationStatus),
    'Each pipeline result includes validation output',
  );
  assert(
    results.every((result) => typeof result.stages.duplicateDetection.result.duplicate === 'boolean'),
    'Each pipeline result includes duplicate detection output',
  );

  const sparseResult = results.find((result) =>
    result.pendingRecord.originalMessage.includes('attendance'),
  );
  assert(sparseResult?.pendingStatus === 'Needs Review', 'Sparse message is routed to Needs Review');

  const stored = await PendingRecord.find({ originalMessage: new RegExp(TEST_PREFIX) });
  assert(stored.length === SAMPLE_MESSAGES.length, 'PendingRecords are persisted in MongoDB');

  const placementCountAfter = await Placement.countDocuments();
  assert(
    placementCountBefore === placementCountAfter,
    'Pipeline does not write to final placement collection',
  );
};

const testDuplicateNeedsReview = async (): Promise<void> => {
  console.log('\n--- Duplicate review routing ---');

  const seededPlacement = await Placement.create({
    studentName: `${TEST_PREFIX}Rahul Patil`,
    company: `${TEST_PREFIX}Infosys`,
    role: 'Software Engineer',
    joiningDate: new Date('2026-07-09'),
  });

  const pipeline = createMockedPipeline();
  const duplicateMessage = createWhatsAppMessage(
    `${TEST_PREFIX}Duplicate check: Rahul Patil secured placement at Infosys as Software Engineer.`,
  );

  const result = await pipeline.processWhatsAppMessage(duplicateMessage);
  assert(result.pendingStatus === 'Needs Review', 'Duplicate match routes record to Needs Review');
  assert(
    result.stages.duplicateDetection.result.duplicate === true,
    'Duplicate detection flags similar existing record',
  );
  assert(
    result.stages.duplicateDetection.result.matchingRecordId === String(seededPlacement._id),
    'Duplicate detection returns matching record id',
  );

  await Placement.deleteOne({ _id: seededPlacement._id });
};

const testLivePipeline = async (): Promise<void> => {
  console.log('\n--- Live Gemini AI pipeline ---');

  if (!isGeminiConfigured()) {
    console.log('SKIP: GEMINI_API_KEY is not configured for live pipeline tests');
    return;
  }

  const placementCountBefore = await Placement.countDocuments();
  const results = [];

  for (const message of SAMPLE_MESSAGES.slice(0, 3)) {
    results.push(await aiPipelineService.processWhatsAppMessage(message));
  }

  assert(results.length === 3, 'Live pipeline processed sample WhatsApp messages');
  assert(
    results.every((result) => Boolean(result.pendingRecord._id)),
    'Live pipeline creates PendingRecords',
  );

  const placementCountAfter = await Placement.countDocuments();
  assert(
    placementCountBefore === placementCountAfter,
    'Live pipeline does not write to final collections',
  );
};

const runTests = async (): Promise<void> => {
  console.log('Running AI pipeline tests...');

  testPipelineUtilities();
  await connectDatabase();
  await cleanupPipelineTestData();

  try {
    await testMockedPipeline();
    await testDuplicateNeedsReview();
    await testLivePipeline();
  } finally {
    await cleanupPipelineTestData();
    await disconnectDatabase();
  }

  console.log('\nAll AI pipeline tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nAI pipeline tests failed:', error);

  try {
    await cleanupPipelineTestData();
    await disconnectDatabase();
  } catch {
    // Ignore cleanup failures after test failure.
  }

  process.exit(1);
});
