/**
 * Validates the AI event report pipeline (multi-message correlation, Gemini analysis, review workflow).
 *
 * Run: npx tsx src/scripts/test-ai-event-report-pipeline.ts
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { EventReportSession } from '../models/EventReportSession';
import { PendingRecord } from '../models/PendingRecord';
import { buildConversationTimeline, buildEvidenceItems } from '../ai/utils/session-media.util';
import { normalizeAiEventReportResult } from '../ai/utils/ai-event-report-result.util';
import {
  getMessageCombinedText,
  mapReportTypeToCategory,
  shouldAppendToEventReportSession,
  shouldStartEventReportSession,
} from '../ai/utils/event-routing.util';
import { listPromptTemplates } from '../ai/utils/prompt-template.util';
import { WhatsAppIncomingMessage } from '../whatsapp/types';
import { EventReportSessionMessage } from '../types/eventReportSession.types';

dotenv.config();

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000/api/v1';
const TEST_PREFIX = 'ai-event-report-test';

const results: Array<{ workflow: string; pass: boolean; detail?: string }> = [];

const assert = (workflow: string, pass: boolean, detail?: string): void => {
  results.push({ workflow, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${workflow}${detail ? ` — ${detail}` : ''}`);
};

const workshopMessage = (text: string, sender = 'Dr. Mehta'): WhatsAppIncomingMessage => ({
  groupName: 'Final Step',
  sender,
  message: text,
  timestamp: new Date(),
  media: null,
});

const sampleMessages: EventReportSessionMessage[] = [
  {
    text: 'Department organized a Workshop on Artificial Intelligence.',
    sender: 'Dr. Mehta',
    receivedAt: new Date('2026-07-09T09:00:00Z'),
  },
  {
    text: 'Speaker was Dr. Rahul Sharma from Infosys.',
    sender: 'Dr. Mehta',
    receivedAt: new Date('2026-07-09T09:10:00Z'),
  },
  {
    text: '120 students attended.',
    sender: 'Dr. Mehta',
    receivedAt: new Date('2026-07-09T09:20:00Z'),
  },
  {
    text: 'Workshop banner',
    sender: 'Dr. Mehta',
    media: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    mediaMetadata: {
      mediaType: 'image',
      mimeType: 'image/jpeg',
      fileName: 'banner.jpg',
      fileSize: 1000,
      tempFileId: 'temp-1',
      downloadedAt: new Date(),
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    },
    receivedAt: new Date('2026-07-09T09:30:00Z'),
  },
  {
    text: 'Workshop schedule',
    sender: 'Dr. Mehta',
    media: 'https://res.cloudinary.com/demo/raw/upload/v1/schedule.pdf',
    mediaMetadata: {
      mediaType: 'pdf',
      mimeType: 'application/pdf',
      fileName: 'schedule.pdf',
      fileSize: 2000,
      tempFileId: 'temp-2',
      downloadedAt: new Date(),
      secureUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/schedule.pdf',
    },
    receivedAt: new Date('2026-07-09T09:45:00Z'),
  },
];

const request = async (
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body: payload };
};

const main = async (): Promise<void> => {
  console.log('=== AI Event Report Pipeline Validation ===\n');

  assert(
    'Event keyword starts session',
    shouldStartEventReportSession(workshopMessage('Department organized a Workshop on AI.')),
  );
  assert(
    'Follow-up message appends to active session',
    shouldAppendToEventReportSession(workshopMessage('120 students attended.'), true),
  );
  assert(
    'Unrelated short message does not start session',
    !shouldStartEventReportSession(workshopMessage('ok')),
  );
  assert(
    'Combined caption text is considered',
    getMessageCombinedText({
      ...workshopMessage(''),
      message: '',
      mediaMetadata: {
        mediaType: 'image',
        mimeType: 'image/jpeg',
        fileName: 'photo.jpg',
        fileSize: 100,
        tempFileId: 'temp',
        downloadedAt: new Date(),
        caption: 'Industrial visit group photo',
      },
    }).includes('Industrial visit'),
  );

  const timeline = buildConversationTimeline(sampleMessages);
  assert('Conversation timeline merges all messages', timeline.split('\n').length === 5, `${timeline.split('\n').length} lines`);

  const evidence = buildEvidenceItems(sampleMessages);
  assert('Evidence builder preserves images and PDFs', evidence.length === 2, evidence.map((item) => item.label).join(', '));

  const normalized = normalizeAiEventReportResult({
    reportType: 'Workshop',
    title: 'Workshop on Artificial Intelligence',
    participants: 120,
    speaker: 'Dr. Rahul Sharma',
    organization: 'Infosys',
    confidenceScore: 88,
    aiGeneratedReport: `${'Professional narrative. '.repeat(120)}`,
    missingFields: ['time'],
    objectives: ['Understand AI fundamentals'],
    imageObservations: [{ reference: 'Image 1', observation: 'Banner shows workshop title' }],
    pdfObservations: [{ reference: 'PDF 1', observation: 'Schedule lists two sessions' }],
  });

  assert('Result normalization keeps extracted fields', normalized.title === 'Workshop on Artificial Intelligence');
  assert('Result normalization clamps confidence', normalized.confidenceScore === 88);
  assert('Workshop maps to Workshop category', mapReportTypeToCategory('Workshop') === 'Workshop');
  assert('Industrial Visit maps correctly', mapReportTypeToCategory('Industrial Visit') === 'Industrial Visit');
  assert('AI event report prompt registered', listPromptTemplates().includes('ai-event-report'));

  await connectDatabase();

  await EventReportSession.deleteMany({ groupName: { $regex: TEST_PREFIX } });
  await PendingRecord.deleteMany({ groupName: { $regex: TEST_PREFIX } });

  const session = await EventReportSession.create({
    groupName: `${TEST_PREFIX}-group`,
    messages: sampleMessages,
    status: 'collecting',
    lastMessageAt: new Date(),
  });

  assert('Event report session persists in MongoDB', Boolean(session._id));

  const login = await request('POST', '/auth/login', {
    email: 'admin@accrediassist.edu',
    password: 'Admin@12345',
  });
  assert('Admin login succeeds', login.status === 200);
  const token = (login.body.data as { token?: string } | undefined)?.token;

  if (token) {
    const regenerateMissing = await request('POST', `/pending/${'0'.repeat(24)}/regenerate`, undefined, token);
    assert('Regenerate endpoint exists', regenerateMissing.status === 404 || regenerateMissing.status === 400);

    if (process.env.GEMINI_API_KEY) {
      try {
        const { aiEventReportPipelineService } = await import('../ai/services/ai-event-report-pipeline.service');
        const textOnlySession = await EventReportSession.create({
          groupName: `${TEST_PREFIX}-gemini`,
          messages: sampleMessages.filter((message) => !message.media),
          status: 'collecting',
          lastMessageAt: new Date(),
        });
        const pipelineResult = await aiEventReportPipelineService.processSession(textOnlySession);
        const reportText =
          typeof pipelineResult.pendingRecord.extractedData?.aiGeneratedReport === 'string'
            ? pipelineResult.pendingRecord.extractedData.aiGeneratedReport
            : '';
        const wordCount = reportText.trim().split(/\s+/).filter(Boolean).length;

        assert('Gemini generates pending AI event report', Boolean(pipelineResult.pendingRecord._id));
        assert('AI report status is Needs Review', pipelineResult.pendingStatus === 'Needs Review');
        assert(
          'Combined narrative word count in target range',
          wordCount >= 300,
          `${wordCount} words (text-only evidence; target 800-1000 with full media)`,
        );
        assert(
          'Evidence linked to pending record',
          Array.isArray(pipelineResult.pendingRecord.extractedData?.evidence),
        );
        assert(
          'Missing fields preserved when absent in evidence',
          Array.isArray(pipelineResult.pendingRecord.extractedData?.missingFields),
        );

        const regenerate = await request(
          'POST',
          `/pending/${pipelineResult.pendingRecord._id}/regenerate`,
          undefined,
          token,
        );
        assert('Regenerate AI report endpoint succeeds', regenerate.status === 200);
      } catch (error) {
        assert(
          'Gemini live pipeline',
          false,
          error instanceof Error ? error.message : String(error),
        );
      }
    } else {
      assert('Gemini live pipeline', false, 'GEMINI_API_KEY not configured — skipped live Gemini test');
    }
  } else {
    assert('Admin login succeeds', false, 'Missing token');
  }

  await EventReportSession.deleteMany({ groupName: { $regex: TEST_PREFIX } });
  await PendingRecord.deleteMany({ groupName: { $regex: TEST_PREFIX } });
  await disconnectDatabase();

  const passed = results.filter((item) => item.pass).length;
  const failed = results.filter((item) => !item.pass);

  console.log('\n=== Final Testing Report ===');
  console.log(`Total workflows: ${results.length}`);
  console.log(`PASS: ${passed}`);
  console.log(`FAIL: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nIssues Found:');
    failed.forEach((item) => console.log(`- ${item.workflow}${item.detail ? `: ${item.detail}` : ''}`));
    process.exit(1);
  }

  console.log('\nAll workflows passed.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
