/**
 * Validates multi-image event session handling — all images must be preserved.
 *
 * Run: npx tsx src/scripts/test-multi-image-event-session.ts
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { EventReportSession } from '../models/EventReportSession';
import { eventCorrelationService } from '../services/event-correlation.service';
import { buildMediaItems } from '../ai/utils/session-media.util';
import { WhatsAppIncomingMessage } from '../whatsapp/types';

dotenv.config();

const TEST_GROUP = 'multi-image-test-group';
const results: Array<{ scenario: string; pass: boolean; detail?: string }> = [];

const assert = (scenario: string, pass: boolean, detail?: string) => {
  results.push({ scenario, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${scenario}${detail ? ` — ${detail}` : ''}`);
};

const textMessage = (text: string): WhatsAppIncomingMessage => ({
  groupName: TEST_GROUP,
  sender: 'Dr. Mehta',
  message: text,
  timestamp: new Date(),
  media: null,
});

const imageMessage = (index: number, caption?: string): WhatsAppIncomingMessage => ({
  groupName: TEST_GROUP,
  sender: 'Dr. Mehta',
  message: caption ?? '',
  timestamp: new Date(Date.now() + index * 100),
  media: `https://res.cloudinary.com/demo/image/upload/v1/workshop-${index}.jpg`,
  mediaMetadata: {
    mediaType: 'image',
    mimeType: 'image/jpeg',
    fileName: `workshop-${index}.jpg`,
    fileSize: 1000 + index,
    tempFileId: `temp-${index}`,
    downloadedAt: new Date(),
    secureUrl: `https://res.cloudinary.com/demo/image/upload/v1/workshop-${index}.jpg`,
    publicId: `workshop-${index}`,
    caption,
    contentBase64: Buffer.from(`fake-image-${index}`).toString('base64'),
  },
});

const pdfMessage = (index: number, fileName: string): WhatsAppIncomingMessage => ({
  groupName: TEST_GROUP,
  sender: 'Dr. Mehta',
  message: fileName,
  timestamp: new Date(Date.now() + index * 100),
  media: `https://res.cloudinary.com/demo/raw/upload/v1/schedule-${index}.pdf`,
  mediaMetadata: {
    mediaType: 'pdf',
    mimeType: 'application/pdf',
    fileName,
    fileSize: 5000,
    tempFileId: `pdf-${index}`,
    downloadedAt: new Date(),
    secureUrl: `https://res.cloudinary.com/demo/raw/upload/v1/schedule-${index}.pdf`,
    publicId: `schedule-${index}`,
    contentBase64: Buffer.from(`fake-pdf-${index}`).toString('base64'),
  },
});

async function simulateBurst(messages: WhatsAppIncomingMessage[]): Promise<void> {
  await Promise.all(messages.map((message) => eventCorrelationService.handleMessage(message)));
}

async function getCollectingSession() {
  return EventReportSession.findOne({ groupName: TEST_GROUP, status: 'collecting' }).sort({
    lastMessageAt: -1,
  });
}

async function runScenario(
  name: string,
  messages: WhatsAppIncomingMessage[],
  expectedImages: number,
  expectedPdfs: number,
): Promise<void> {
  await EventReportSession.deleteMany({ groupName: TEST_GROUP });

  await simulateBurst(messages);

  const session = await getCollectingSession();
  assert(`${name}: session created`, Boolean(session));

  if (!session) return;

  const media = buildMediaItems(session.messages);
  const images = media.filter((item) => item.type === 'image');
  const pdfs = media.filter((item) => item.type === 'pdf');

  assert(
    `${name}: all images stored`,
    images.length === expectedImages,
    `expected ${expectedImages}, got ${images.length}`,
  );
  assert(
    `${name}: all PDFs stored`,
    pdfs.length === expectedPdfs,
    `expected ${expectedPdfs}, got ${pdfs.length}`,
  );
  assert(
    `${name}: message count matches`,
    session.messages.length === messages.length,
    `expected ${messages.length}, got ${session.messages.length}`,
  );

  const urls = media.map((item) => item.url);
  const uniqueUrls = new Set(urls);
  assert(
    `${name}: no duplicate overwrites`,
    uniqueUrls.size === urls.length,
    `${urls.length} items, ${uniqueUrls.size} unique URLs`,
  );
}

const main = async (): Promise<void> => {
  console.log('=== Multi-Image Event Session Tests ===\n');

  const offlineMessages = [
    textMessage('Workshop on AI'),
    imageMessage(1, 'Banner'),
    imageMessage(2, 'Speaker'),
    imageMessage(3, 'Students'),
    imageMessage(4, 'Group Photo'),
  ];
  const offlineMedia = buildMediaItems(
    offlineMessages.map((message, index) => ({
      text: message.message || message.mediaMetadata?.caption || '',
      sender: message.sender,
      media: message.media ?? undefined,
      mediaMetadata: message.mediaMetadata ?? null,
      receivedAt: new Date(Date.now() + index * 1000),
    })),
  );
  assert('Offline: buildMediaItems preserves 4 images', offlineMedia.filter((m) => m.type === 'image').length === 4);
  assert(
    'Offline: buildMediaItems keeps upload order',
    offlineMedia[0]?.label === 'Image 1' && offlineMedia[3]?.label === 'Image 4',
  );
  assert(
    'Offline: captions preserved',
    offlineMedia.every((item) => Boolean(item.caption)),
    offlineMedia.map((item) => item.caption).join(', '),
  );

  let mongoConnected = false;
  try {
    await mongoose.connect(env.MONGODB_URI);
    mongoConnected = true;
    console.log('MongoDB connected for live session tests\n');
  } catch (error) {
    console.warn('MongoDB unavailable — skipping live session tests');
    console.warn(error instanceof Error ? error.message : String(error));
    const failed = results.filter((item) => !item.pass);
    console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} PASS (offline only) ===`);
    process.exit(failed.length > 0 ? 1 : 0);
  }

  if (mongoConnected) {
  await runScenario(
    '1 text + 4 images',
    [
      textMessage('Workshop on Artificial Intelligence conducted today.'),
      imageMessage(1, 'Workshop Banner'),
      imageMessage(2, 'Speaker Session'),
      imageMessage(3, 'Student Participation'),
      imageMessage(4, 'Group Photo'),
    ],
    4,
    0,
  );

  await runScenario(
    '1 text + 8 images',
    [
      textMessage('Industrial visit to Infosys campus.'),
      ...Array.from({ length: 8 }, (_, index) => imageMessage(index + 1, `Visit Photo ${index + 1}`)),
    ],
    8,
    0,
  );

  await runScenario(
    '1 text + 3 images + 2 PDFs',
    [
      textMessage('Department workshop completed successfully.'),
      imageMessage(1, 'Workshop Banner'),
      imageMessage(2, 'Speaker on stage'),
      imageMessage(3, 'Audience photo'),
      pdfMessage(1, 'Workshop Schedule.pdf'),
      pdfMessage(2, 'Attendance Sheet.pdf'),
    ],
    3,
    2,
  );

  await EventReportSession.deleteMany({ groupName: TEST_GROUP });
  await mongoose.disconnect();
  }

  const failed = results.filter((item) => !item.pass);
  console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} PASS ===`);
  if (failed.length > 0) {
    failed.forEach((item) => console.log(`- ${item.scenario}: ${item.detail ?? 'failed'}`));
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
