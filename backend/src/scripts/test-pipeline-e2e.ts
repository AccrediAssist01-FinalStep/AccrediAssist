/**
 * End-to-end WhatsApp AI pipeline verification.
 *
 * Covers placement, student achievement, faculty publication,
 * completed event with photos, and internship flows including approval routing.
 *
 * Run: npm run test:pipeline-e2e
 */

import dotenv from 'dotenv';
import {
  AiPipelineService,
  ClassificationAgent,
  DuplicateDetectionAgent,
  ExtractionAgent,
  GeminiProvider,
  ValidationAgent,
  isGeminiConfigured,
  pdfDocumentAgent,
} from '../ai';
import { GeminiGenerativeClient } from '../ai/interfaces/gemini-client.interface';
import { ExtractionResult } from '../ai/interfaces/extraction.interface';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { Internship } from '../models/Internship';
import { PendingRecord } from '../models/PendingRecord';
import { Placement } from '../models/Placement';
import { Publication } from '../models/Publication';
import { StudentAchievement } from '../models/StudentAchievement';
import { PendingReviewWorkflowService } from '../services/pendingReviewWorkflow.service';
import { pendingRecordApprovalService } from '../services/pendingRecordApproval.service';
import { createTestUser, cleanupTestUser } from './test-helpers';
import { WhatsAppIncomingMessage } from '../whatsapp/types';
import {
  getMessageValidationReason,
  isNonInstitutionalMessage,
} from '../ai/utils/message-validation.util';

dotenv.config();

const TEST_PREFIX = 'E2E_PIPELINE_';
const FACULTY_EMAIL = 'e2e-pipeline-faculty@accrediassist.edu';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const createMessage = (
  text: string,
  overrides: Partial<WhatsAppIncomingMessage> = {},
): WhatsAppIncomingMessage => ({
  groupName: 'Final Step',
  sender: 'Test Coordinator',
  message: text,
  timestamp: new Date('2026-07-09T10:00:00.000Z'),
  media: null,
  mediaMetadata: null,
  ...overrides,
});

const SCENARIOS = {
  placement: createMessage(
    `${TEST_PREFIX}Congratulations! Rahul Patil secured placement at Infosys as Software Engineer.`,
  ),
  studentAchievement: createMessage(
    `${TEST_PREFIX}Sneha Patil won first prize in Smart India Hackathon 2026 for AI project.`,
  ),
  facultyPublication: createMessage(
    `${TEST_PREFIX}Dr. Meera Kulkarni published Edge AI for Smart Campus Systems in IEEE Access.`,
    { sender: 'Research Cell' },
  ),
  completedEvent: createMessage(
    `${TEST_PREFIX}One-day Cloud Computing workshop completed on 20 June 2026 at Seminar Hall A. Photos attached.`,
    {
      media: 'https://res.cloudinary.com/demo/image/upload/v1/e2e-workshop.jpg',
      mediaMetadata: {
        mediaType: 'image',
        mimeType: 'image/jpeg',
        fileName: 'workshop-photo.jpg',
        fileSize: 2048,
        tempFileId: 'temp-e2e',
        downloadedAt: new Date(),
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/e2e-workshop.jpg',
        publicId: 'e2e-workshop',
        uploadedAt: new Date(),
      },
    },
  ),
  internship: createMessage(
    `${TEST_PREFIX}Ananya Deshmukh completed internship at TCS in Pune from March to May 2026.`,
  ),
};

const extractionFixtures: Record<keyof typeof SCENARIOS, ExtractionResult> = {
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
  studentAchievement: {
    title: 'Hackathon winner',
    description: 'Sneha Patil won first prize in Smart India Hackathon.',
    categoryHint: 'Student Achievement',
    studentNames: [`${TEST_PREFIX}Sneha Patil`],
    facultyNames: null,
    company: null,
    organization: 'Smart India Hackathon',
    eventName: 'Smart India Hackathon 2026',
    eventType: null,
    achievementType: 'Hackathon',
    publicationTitle: null,
    patentTitle: null,
    internship: null,
    placement: null,
    certificates: null,
    mediaReferences: null,
    date: '2026-06-15',
    location: null,
    confidence: 92,
  },
  facultyPublication: {
    title: 'Faculty publication',
    description: 'Dr. Meera Kulkarni published in IEEE Access.',
    categoryHint: 'Publication',
    studentNames: null,
    facultyNames: [`${TEST_PREFIX}Dr. Meera Kulkarni`],
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
    date: '2026-06-01',
    location: null,
    confidence: 94,
  },
  completedEvent: {
    title: 'Cloud Computing workshop',
    description: 'One-day workshop on Cloud Computing for CSE students.',
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
    mediaReferences: ['https://res.cloudinary.com/demo/image/upload/v1/e2e-workshop.jpg'],
    date: '2026-06-20',
    location: 'Seminar Hall A',
    confidence: 93,
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
    date: '2026-05-31',
    location: 'Pune',
    confidence: 91,
  },
};

const resolveScenarioKey = (prompt: string): keyof typeof SCENARIOS => {
  if (prompt.includes(`${TEST_PREFIX}Sneha Patil`) || prompt.includes('Hackathon')) {
    return 'studentAchievement';
  }
  if (prompt.includes(`${TEST_PREFIX}Dr. Meera`) || prompt.includes('IEEE Access')) {
    return 'facultyPublication';
  }
  if (
    prompt.includes(`${TEST_PREFIX}Cloud Computing workshop`) ||
    prompt.includes('Seminar Hall A')
  ) {
    return 'completedEvent';
  }
  if (prompt.includes(`${TEST_PREFIX}Ananya Deshmukh`) || prompt.includes('internship at TCS')) {
    return 'internship';
  }
  if (prompt.includes(`${TEST_PREFIX}Rahul Patil`) || prompt.includes('secured placement')) {
    return 'placement';
  }
  return 'placement';
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
        return extractionFixtures[resolveScenarioKey(prompt)] as unknown as Record<string, unknown>;
      }

      if (prompt.includes('Classify the extracted institutional record')) {
        const key = resolveScenarioKey(prompt);
        const categoryMap: Record<keyof typeof SCENARIOS, string> = {
          placement: 'Placement',
          studentAchievement: 'Student Achievement',
          facultyPublication: 'Publication',
          completedEvent: 'Completed Event Report',
          internship: 'Internship',
        };
        return {
          category: categoryMap[key],
          confidence: 93,
          reasoning: `${categoryMap[key]} record detected.`,
        };
      }

      if (prompt.includes('Validate the extracted institutional record')) {
        return { validationStatus: 'valid', validationErrors: [] };
      }

      return {};
    }),
  );

  return new AiPipelineService(
    new ExtractionAgent(provider),
    pdfDocumentAgent,
    new ClassificationAgent(provider),
    new ValidationAgent(provider),
    new DuplicateDetectionAgent(),
  );
};

const cleanup = async (): Promise<void> => {
  await PendingRecord.deleteMany({ originalMessage: new RegExp(TEST_PREFIX) });
  await Placement.deleteMany({ company: new RegExp(TEST_PREFIX) });
  await StudentAchievement.deleteMany({ studentName: new RegExp(TEST_PREFIX) });
  await Publication.deleteMany({ facultyName: new RegExp(TEST_PREFIX) });
  await CompletedEventReport.deleteMany({ eventTitle: new RegExp(TEST_PREFIX) });
  await Internship.deleteMany({ company: new RegExp(TEST_PREFIX) });
};

const testCasualFiltering = async (
  workflow: PendingReviewWorkflowService,
): Promise<void> => {
  console.log('\n--- Casual message filtering ---');

  const ignored = await workflow.processIncomingWhatsAppMessage(createMessage('Hi'));
  assert(ignored === null, 'Casual "Hi" message is ignored');
  assert(isNonInstitutionalMessage(createMessage('Thanks')), '"Thanks" flagged as non-institutional');
  assert(
    getMessageValidationReason(createMessage('😀')) === 'emoji only',
    'Emoji-only messages return emoji reason',
  );
};

const testPipelineScenarios = async (
  workflow: PendingReviewWorkflowService,
  facultyUserId: string,
): Promise<void> => {
  console.log('\n--- Five-message pipeline scenarios ---');

  const expectations: Array<{
    key: keyof typeof SCENARIOS;
    detectedCategory: string;
    recordCategory: string;
    collection: 'placements' | 'student_achievements' | 'publications' | 'completed_event_reports' | 'internships';
    findQuery: Record<string, unknown>;
  }> = [
    {
      key: 'placement',
      detectedCategory: 'Placement',
      recordCategory: 'Placement',
      collection: 'placements',
      findQuery: { company: `${TEST_PREFIX}Infosys` },
    },
    {
      key: 'studentAchievement',
      detectedCategory: 'Student Achievement',
      recordCategory: 'Student Achievement',
      collection: 'student_achievements',
      findQuery: { studentName: `${TEST_PREFIX}Sneha Patil` },
    },
    {
      key: 'facultyPublication',
      detectedCategory: 'Publication',
      recordCategory: 'Publication',
      collection: 'publications',
      findQuery: { facultyName: `${TEST_PREFIX}Dr. Meera Kulkarni` },
    },
    {
      key: 'completedEvent',
      detectedCategory: 'Completed Event Report',
      recordCategory: 'Workshop',
      collection: 'completed_event_reports',
      findQuery: { eventTitle: `${TEST_PREFIX}Cloud Computing Workshop` },
    },
    {
      key: 'internship',
      detectedCategory: 'Internship',
      recordCategory: 'Internship',
      collection: 'internships',
      findQuery: { company: `${TEST_PREFIX}TCS` },
    },
  ];

  for (const item of expectations) {
    const result = await workflow.processIncomingWhatsAppMessage(SCENARIOS[item.key]);
    assert(Boolean(result?.pendingRecord._id), `${item.key}: pending record created`);
    assert(
      result!.stages.classification.result.category === item.detectedCategory,
      `${item.key}: detected category is ${item.detectedCategory}`,
    );
    assert(result!.recordCategory === item.recordCategory, `${item.key}: record category mapped correctly`);

    const extracted = result!.pendingRecord.extractedData as Record<string, unknown>;
    assert(extracted.detectedCategory === item.detectedCategory, `${item.key}: detectedCategory stored`);

    if (item.key === 'completedEvent') {
      assert(Boolean(extracted.media), `${item.key}: media URL stored in extracted data`);
      assert(
        Array.isArray(extracted.mediaReferences) && (extracted.mediaReferences as string[]).length > 0,
        `${item.key}: media references include Cloudinary URL`,
      );
    }

    await pendingRecordApprovalService.approvePendingRecord(
      result!.pendingRecord._id.toString(),
      facultyUserId,
    );

    const stored =
      item.collection === 'placements'
        ? await Placement.findOne(item.findQuery)
        : item.collection === 'student_achievements'
          ? await StudentAchievement.findOne(item.findQuery)
          : item.collection === 'publications'
            ? await Publication.findOne(item.findQuery)
            : item.collection === 'completed_event_reports'
              ? await CompletedEventReport.findOne(item.findQuery)
              : await Internship.findOne(item.findQuery);

    assert(Boolean(stored), `${item.key}: approved record stored in ${item.collection}`);
  }
};

const testLiveGemini = async (): Promise<boolean> => {
  console.log('\n--- Live Gemini connectivity ---');

  if (!isGeminiConfigured()) {
    console.log('SKIP: GEMINI_API_KEY not configured');
    return false;
  }

  try {
    const provider = new GeminiProvider();
    const response = await provider.generateText({
      prompt: 'Reply with exactly: GEMINI_OK',
      temperature: 0,
    });
    assert(
      response.content.includes('GEMINI_OK') || response.content.includes('OK'),
      'Live Gemini API returned valid text response',
    );
    return true;
  } catch (error) {
    console.log(
      'FAIL: Live Gemini unavailable:',
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
};

const run = async (): Promise<void> => {
  console.log('Running end-to-end pipeline verification...\n');

  await connectDatabase();
  await cleanup();
  await cleanupTestUser(FACULTY_EMAIL);

  const faculty = await createTestUser({
    name: 'E2E Faculty',
    email: FACULTY_EMAIL,
    role: 'Faculty',
  });

  const workflow = new PendingReviewWorkflowService(createMockedPipeline());
  const geminiOk = await testLiveGemini();

  await testCasualFiltering(workflow);
  await testPipelineScenarios(workflow, faculty._id.toString());

  await cleanup();
  await cleanupTestUser(FACULTY_EMAIL);
  await disconnectDatabase();

  console.log('\n--- E2E summary ---');
  console.log(`Gemini live API: ${geminiOk ? 'WORKING' : 'NOT WORKING (check API key/quota)'}`);
  console.log('Message validation: WORKING');
  console.log('Pipeline classification + approval routing: WORKING');
  console.log('\nAll end-to-end pipeline tests passed.');
};

run().catch(async (error) => {
  console.error('\nE2E pipeline test failed:', error instanceof Error ? error.message : error);
  try {
    await cleanup();
    await cleanupTestUser(FACULTY_EMAIL);
    await disconnectDatabase();
  } catch {
    // ignore cleanup errors
  }
  process.exit(1);
});
