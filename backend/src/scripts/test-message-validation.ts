/**
 * Message validation tests for WhatsApp casual-message filtering.
 *
 * Run: npm run test:message-validation
 */

import {
  getMessageValidationReason,
  isNonInstitutionalMessage,
} from '../ai/utils/message-validation.util';
import { WhatsAppIncomingMessage } from '../whatsapp/types';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const createMessage = (
  message: string,
  overrides: Partial<WhatsAppIncomingMessage> = {},
): WhatsAppIncomingMessage => ({
  groupName: 'Final Step',
  sender: 'Test User',
  message,
  timestamp: new Date(),
  media: null,
  mediaMetadata: null,
  ...overrides,
});

const CASUAL_MESSAGES = [
  'Hi',
  'Hello',
  'Good Morning',
  'Thanks',
  'Ok',
  '😀👍',
  'hey there',
];

const INSTITUTIONAL_MESSAGES = [
  'Rahul Patil secured placement at Infosys as Software Engineer with 6 LPA package.',
  'Ananya completed internship at TCS for 2 months.',
  'Dr. Meera published a paper in IEEE Access on Edge AI.',
  'One-day workshop on Cloud Computing was conducted at Seminar Hall A.',
  'Student won first prize in national hackathon.',
];

const run = (): void => {
  console.log('Running message validation tests...\n');

  for (const text of CASUAL_MESSAGES) {
    const message = createMessage(text);
    assert(isNonInstitutionalMessage(message), `"${text}" is ignored as non-institutional`);
    assert(
      getMessageValidationReason(message) !== null,
      `"${text}" returns a validation reason`,
    );
  }

  for (const text of INSTITUTIONAL_MESSAGES) {
    const message = createMessage(text);
    assert(!isNonInstitutionalMessage(message), `"${text.slice(0, 40)}..." is processed`);
    assert(getMessageValidationReason(message) === null, 'Institutional message has no ignore reason');
  }

  const mediaOnly = createMessage('', {
    media: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    mediaMetadata: {
      mediaType: 'image',
      mimeType: 'image/jpeg',
      fileName: 'certificate.jpg',
      fileSize: 1024,
      tempFileId: 'temp-1',
      downloadedAt: new Date(),
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      publicId: 'sample',
      uploadedAt: new Date(),
    },
  });
  assert(!isNonInstitutionalMessage(mediaOnly), 'Media messages are never ignored');

  console.log('\nAll message validation tests passed.');
};

run();
