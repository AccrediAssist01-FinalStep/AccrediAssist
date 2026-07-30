/**
 * End-to-end Pending Review workflow tests.
 *
 * Flow:
 * WhatsApp Message -> Gemini Extraction -> Classification -> Validation ->
 * Duplicate Detection -> Pending Review -> Faculty Edit -> Approve/Reject ->
 * Final Collection -> Audit Log
 *
 * Run: npm run test:pending-review-workflow
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
import { ExtractionResult } from '../ai/interfaces/extraction.interface';
import { GeminiGenerativeClient } from '../ai/interfaces/gemini-client.interface';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { Placement } from '../models/Placement';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { AuditLog } from '../models/AuditLog';
import { PendingReviewWorkflowService } from '../services/pendingReviewWorkflow.service';
import { pendingReviewService } from '../services/pendingReview.service';
import { createTestUser, cleanupTestUser } from './test-helpers';
import { MessageListener } from '../whatsapp/message.listener';
import { createTestMessageUtils } from '../whatsapp/message.mapper';
import { WhatsAppIncomingMessage } from '../whatsapp/types';

dotenv.config();

const TEST_PREFIX = 'WORKFLOW_TEST_';
const FACULTY_EMAIL = 'workflow-faculty@accrediassist.edu';

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

const SAMPLE_MESSAGES = {
  placement: createWhatsAppMessage(
    `${TEST_PREFIX}Congratulations! Rahul Patil secured placement at Infosys as Software Engineer.`,
  ),
  workshop: createWhatsAppMessage(
    `${TEST_PREFIX}One-day workshop on Cloud Computing was conducted on 20 June 2026 at Seminar Hall A.`,
    { groupName: 'Computer Department' },
  ),
  notice: createWhatsAppMessage(`${TEST_PREFIX}Reminder to submit attendance sheets by Friday.`),
};

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
    description: 'Priya Sharma completed internship at Wipro.',
    categoryHint: 'Internship',
    studentNames: [`${TEST_PREFIX}Priya Sharma`],
    facultyNames: null,
    company: `${TEST_PREFIX}Wipro`,
    organization: null,
    eventName: null,
    eventType: null,
    achievementType: null,
    publicationTitle: null,
    patentTitle: null,
    internship: `${TEST_PREFIX}Wipro`,
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
  notice: {
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
};

const resolveFixtureKey = (message: WhatsAppIncomingMessage): keyof typeof extractionFixtures => {
  if (message.message.includes('placement')) return 'placement';
  if (message.message.includes('internship')) return 'internship';
  if (message.message.includes('workshop')) return 'workshop';
  return 'notice';
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
        const message =
          Object.values(SAMPLE_MESSAGES).find((item) => prompt.includes(item.message)) ??
          SAMPLE_MESSAGES.placement;
        return extractionFixtures[resolveFixtureKey(message)] as unknown as Record<string, unknown>;
      }

      if (prompt.includes('Classify the extracted institutional record')) {
        if (prompt.includes('completed internship') || prompt.includes('Category hint from extraction:\nInternship')) {
          return { category: 'Internship', confidence: 92, reasoning: 'Internship record.' };
        }
        if (prompt.includes('workshop on Cloud Computing') || prompt.includes('Category hint from extraction:\nWorkshop')) {
          return { category: 'Workshop', confidence: 93, reasoning: 'Workshop record.' };
        }
        if (prompt.includes('attendance sheets') || prompt.includes('Category hint from extraction:\nnone')) {
          return { category: 'Other', confidence: 60, reasoning: 'General notice.' };
        }
        return { category: 'Placement', confidence: 94, reasoning: 'Placement record.' };
      }

      if (prompt.includes('Validate the extracted institutional record')) {
        if (prompt.includes('attendance sheets')) {
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
    pdfDocumentAgent,
    new ClassificationAgent(provider),
    new ValidationAgent(provider),
    new DuplicateDetectionAgent(),
  );
};

const cleanupTestData = async (): Promise<void> => {
  await PendingRecord.deleteMany({ originalMessage: new RegExp(TEST_PREFIX) });
  await Placement.deleteMany({ company: new RegExp(TEST_PREFIX) });
  await CompletedEventReport.deleteMany({ eventTitle: new RegExp(TEST_PREFIX) });
  await AuditLog.deleteMany({ description: new RegExp(TEST_PREFIX) });
};

let facultyUserId: string;

const setup = async (): Promise<PendingReviewWorkflowService> => {
  await connectDatabase();
  await cleanupTestData();
  await cleanupTestUser(FACULTY_EMAIL);

  const faculty = await createTestUser({
    name: 'Workflow Faculty',
    email: FACULTY_EMAIL,
    role: 'Faculty',
  });
  facultyUserId = faculty._id.toString();

  return new PendingReviewWorkflowService(createMockedPipeline());
};

const teardown = async (): Promise<void> => {
  await cleanupTestData();
  await cleanupTestUser(FACULTY_EMAIL);
  await disconnectDatabase();
};

const testWhatsAppToPendingReview = async (
  workflow: PendingReviewWorkflowService,
): Promise<void> => {
  console.log('\n--- WhatsApp -> AI Pipeline -> Pending Review ---');

  const placementResult = await workflow.processIncomingWhatsAppMessage(SAMPLE_MESSAGES.placement);
  const workshopResult = await workflow.processIncomingWhatsAppMessage(SAMPLE_MESSAGES.workshop);
  const noticeResult = await workflow.processIncomingWhatsAppMessage(SAMPLE_MESSAGES.notice);

  assert(Boolean(placementResult.pendingRecord._id), 'Placement message creates pending record');
  assert(placementResult.recordCategory === 'Placement', 'Placement message classified as Placement');
  assert(
    Boolean(placementResult.stages.extraction.result.title),
    'Pipeline runs Gemini extraction stage',
  );
  assert(
    Boolean(placementResult.stages.classification.result.category),
    'Pipeline runs classification stage',
  );
  assert(
    Boolean(placementResult.stages.validation.result.validationStatus),
    'Pipeline runs validation stage',
  );
  assert(
    typeof placementResult.stages.duplicateDetection.result.duplicate === 'boolean',
    'Pipeline runs duplicate detection stage',
  );
  assert(
    Boolean(
      (placementResult.pendingRecord.extractedData as { aiPipeline?: unknown })?.aiPipeline,
    ),
    'Pending record stores AI pipeline metadata',
  );
  assert(placementResult.pendingStatus === 'Approved', 'High-confidence placement is auto-approved');
  assert(workshopResult.recordCategory === 'Workshop', 'Workshop message classified correctly');
  assert(workshopResult.pendingStatus === 'Approved', 'High-confidence workshop is auto-approved');
  assert(noticeResult.pendingStatus === 'Rejected', 'Low-confidence notice is auto-rejected');

  const autoApprovedPlacements = await Placement.countDocuments({ company: new RegExp(TEST_PREFIX) });
  assert(autoApprovedPlacements >= 1, 'Auto-approved placement is stored in final collection');
};

const testFacultyEditAndApprove = async (
  workflow: PendingReviewWorkflowService,
  placementId: string,
): Promise<void> => {
  console.log('\n--- Faculty Edit -> Approve -> Final Collection ---');

  const edited = await workflow.editPendingRecord(placementId, facultyUserId, {
    extractedData: {
      title: `${TEST_PREFIX} Updated Infosys Placement`,
      company: `${TEST_PREFIX}Infosys`,
      studentName: `${TEST_PREFIX}Rahul Patil`,
    },
    confidenceScore: 98,
  });

  assert(edited.status === 'Pending', 'Faculty edit does not auto-approve record');
  assert(edited.confidenceScore === 98, 'Faculty edit updates confidence score');
  assert(edited.editHistory?.length === 1, 'Faculty edit maintains edit history');

  const editAudit = await AuditLog.findOne({
    module: 'PendingRecord',
    action: 'UPDATE',
    description: new RegExp(placementId),
  });
  assert(Boolean(editAudit), 'Faculty edit creates audit log entry');

  const approved = await workflow.approvePendingRecord(placementId, facultyUserId);
  assert(approved.status === 'Approved', 'Faculty approve marks pending record approved');

  const placement = await Placement.findOne({ company: `${TEST_PREFIX}Infosys` });
  assert(Boolean(placement), 'Approved record is stored in final Placement collection');
  assert(
    placement?.studentName === `${TEST_PREFIX}Rahul Patil`,
    'Final collection stores edited extracted fields',
  );

  const approveAudit = await AuditLog.findOne({
    module: 'PendingRecord',
    action: 'APPROVE',
    description: new RegExp(placementId),
  });
  assert(Boolean(approveAudit), 'Approve creates PendingRecord audit log entry');

  const createAudit = await AuditLog.findOne({
    module: 'Placement',
    action: 'CREATE',
    description: new RegExp(placementId),
  });
  assert(Boolean(createAudit), 'Approve creates final collection audit log entry');
};

const testRejectPath = async (
  workflow: PendingReviewWorkflowService,
  noticeId: string,
): Promise<void> => {
  console.log('\n--- Reject -> Remains in PendingRecord ---');

  const eventCountBefore = await CompletedEventReport.countDocuments();

  const rejected = await workflow.rejectPendingRecord(noticeId, facultyUserId, {
    reason: `${TEST_PREFIX} Insufficient institutional evidence`,
  });

  assert(rejected.status === 'Rejected', 'Reject marks pending record as Rejected');
  assert(
    rejected.rejectionReason === `${TEST_PREFIX} Insufficient institutional evidence`,
    'Reject stores rejection reason',
  );
  assert(rejected.reviewedBy?.toString() === facultyUserId, 'Reject records faculty reviewer');

  const stored = await PendingRecord.findById(noticeId);
  assert(Boolean(stored), 'Rejected record remains in pending_records collection');
  assert(stored?.isDeleted !== true, 'Rejected record is not deleted');

  const rejectAudit = await AuditLog.findOne({
    module: 'PendingRecord',
    action: 'REJECT',
    description: new RegExp(TEST_PREFIX),
  });
  assert(Boolean(rejectAudit), 'Reject creates audit log entry');

  const eventCountAfter = await CompletedEventReport.countDocuments();
  assert(eventCountBefore === eventCountAfter, 'Reject does not create final event records');
};

const testWhatsAppListenerIntegration = async (
  workflow: PendingReviewWorkflowService,
): Promise<void> => {
  console.log('\n--- WhatsApp Listener -> Workflow Integration ---');

  class MockEventEmitter {
    private handlers = new Map<string, Set<(...args: unknown[]) => void>>();

    on(event: string, handler: (...args: unknown[]) => void): void {
      const eventHandlers = this.handlers.get(event) ?? new Set();
      eventHandlers.add(handler);
      this.handlers.set(event, eventHandlers);
    }

    off(event: string, handler: (...args: unknown[]) => void): void {
      this.handlers.get(event)?.delete(handler);
    }

    emit(event: string, payload: unknown): void {
      for (const handler of this.handlers.get(event) ?? []) {
        handler(payload);
      }
    }
  }

  const listener = new MessageListener();
  listener.setMessageHandler(async (message) => {
    await workflow.processIncomingWhatsAppMessage(message);
  });

  const mockEmitter = new MockEventEmitter();
  const mockSocket = {
    ev: mockEmitter,
    groupFetchAllParticipating: async () => ({
      '120363012345678901@g.us': {
        id: '120363012345678901@g.us',
        subject: 'Final Step',
      },
    }),
    groupMetadata: async () => ({
      id: '120363012345678901@g.us',
      subject: 'Final Step',
    }),
  };

  await listener.start(mockSocket as never, createTestMessageUtils());

  mockEmitter.emit('messages.upsert', {
    type: 'notify',
    messages: [
      {
        key: {
          remoteJid: '120363012345678901@g.us',
          fromMe: false,
          id: 'WORKFLOW_LISTENER_MESSAGE',
          participant: '919999999999@s.whatsapp.net',
        },
        message: {
          conversation: `${TEST_PREFIX}Listener integration: Priya Sharma completed internship at Wipro.`,
        },
        messageTimestamp: 1_722_000_000,
        pushName: 'Workflow Tester',
      },
    ],
  });

  await new Promise((resolve) => setTimeout(resolve, 250));

  const received = listener.getReceivedMessages();
  assert(received.length === 1, 'WhatsApp listener converts incoming message to standard JSON');
  assert(received[0].message.includes('Listener integration'), 'Listener preserves WhatsApp message content');

  const created = await PendingRecord.findOne({
    originalMessage: new RegExp(`${TEST_PREFIX}Listener integration`),
  });
  assert(Boolean(created), 'WhatsApp listener workflow creates pending record');
  assert(created?.category === 'Internship', 'Listener workflow classifies internship message');

  listener.stop();
};

const testLiveWorkflowOptional = async (): Promise<void> => {
  console.log('\n--- Live Gemini workflow (optional) ---');

  if (!isGeminiConfigured()) {
    console.log('SKIP: GEMINI_API_KEY is not configured for live workflow test');
    return;
  }

  try {
    const workflow = new PendingReviewWorkflowService();
    const result = await workflow.processIncomingWhatsAppMessage(SAMPLE_MESSAGES.placement);
    assert(Boolean(result.pendingRecord._id), 'Live Gemini workflow creates pending record');
    await PendingRecord.deleteOne({ _id: result.pendingRecord._id });
  } catch (error) {
    console.log(
      'SKIP: Live Gemini workflow unavailable',
      error instanceof Error ? error.message : String(error),
    );
  }
};

const runTests = async (): Promise<void> => {
  console.log('Running Pending Review workflow tests...');

  const workflow = await setup();

  try {
    await testWhatsAppToPendingReview(workflow);

    const editPending = await pendingReviewService.createPendingRecord({
      originalMessage: `${TEST_PREFIX} Manual placement for faculty edit`,
      category: 'Placement',
      extractedData: {
        company: `${TEST_PREFIX}Infosys`,
        studentName: `${TEST_PREFIX}Rahul Patil`,
        title: `${TEST_PREFIX} Infosys Placement`,
      },
      confidenceScore: 75,
      status: 'Pending',
    });
    await testFacultyEditAndApprove(workflow, editPending._id);

    const rejectPending = await pendingReviewService.createPendingRecord({
      originalMessage: `${TEST_PREFIX} Manual notice for reject path`,
      category: 'Research',
      extractedData: { title: `${TEST_PREFIX} Department notice` },
      confidenceScore: 55,
      status: 'Needs Review',
    });
    await testRejectPath(workflow, rejectPending._id);
    await testWhatsAppListenerIntegration(workflow);
    await testLiveWorkflowOptional();
  } finally {
    await teardown();
  }

  console.log('\nAll Pending Review workflow tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPending Review workflow tests failed:', error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
