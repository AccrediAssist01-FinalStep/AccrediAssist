/**
 * WhatsApp message listener tests.
 *
 * Verifies approved-group filtering, text message handling,
 * and conversion to the Document 15 standard JSON structure.
 * Does NOT send messages to the AI pipeline.
 *
 * Run: npm run test:whatsapp-message-listener
 */

import dotenv from 'dotenv';
import { MessageListener } from '../whatsapp/message.listener';
import {
  createTestMessageUtils,
  extractTextFromMessage,
  toStandardMessage,
  toStandardMessageJson,
} from '../whatsapp/message.mapper';

dotenv.config();

type WAMessage = import('@whiskeysockets/baileys').proto.IWebMessageInfo;

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

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

const createTextMessage = (params: {
  remoteJid: string;
  text: string;
  pushName?: string;
  fromMe?: boolean;
  participant?: string;
}): WAMessage => ({
  key: {
    remoteJid: params.remoteJid,
    fromMe: params.fromMe ?? false,
    id: 'TEST_MESSAGE_ID',
    participant: params.participant,
  },
  message: {
    conversation: params.text,
  },
  messageTimestamp: 1_722_000_000,
  pushName: params.pushName,
});

const createImageMessage = (remoteJid: string): WAMessage => ({
  key: {
    remoteJid,
    fromMe: false,
    id: 'TEST_IMAGE_ID',
  },
  message: {
    imageMessage: {
      caption: 'Photo caption',
    },
  },
  messageTimestamp: 1_722_000_000,
  pushName: 'Photo Sender',
});

const testMessageMapper = (): void => {
  console.log('\n--- Message mapper ---');

  const messageUtils = createTestMessageUtils();

  const textMessage = createTextMessage({
    remoteJid: '120363012345678901@g.us',
    text: 'Rahul Patil secured placement at Infosys.',
    pushName: 'Placement Officer',
  });

  assert(
    extractTextFromMessage(textMessage, messageUtils) === 'Rahul Patil secured placement at Infosys.',
    'Text content is extracted from conversation messages',
  );
  assert(
    extractTextFromMessage(createImageMessage('120363012345678901@g.us'), messageUtils) === null,
    'Non-text messages are ignored by mapper',
  );

  const standardMessage = toStandardMessage({
    groupName: 'Training & Placement',
    sender: 'Placement Officer',
    text: 'Rahul Patil secured placement at Infosys.',
    timestamp: new Date('2026-07-09T10:30:00.000Z'),
  });

  const standardJson = toStandardMessageJson(standardMessage);
  assert(standardJson.groupName === 'Training & Placement', 'Standard JSON includes groupName');
  assert(standardJson.sender === 'Placement Officer', 'Standard JSON includes sender');
  assert(
    standardJson.message === 'Rahul Patil secured placement at Infosys.',
    'Standard JSON includes message text',
  );
  assert(standardJson.timestamp === '2026-07-09T10:30:00.000Z', 'Standard JSON includes ISO timestamp');
  assert(standardJson.media === null, 'Standard JSON sets media to null for text messages');
};

const testMessageListenerFiltering = async (): Promise<void> => {
  console.log('\n--- Message listener filtering ---');

  const listener = new MessageListener();
  const mockEmitter = new MockEventEmitter();
  const handledMessages: ReturnType<typeof toStandardMessageJson>[] = [];

  listener.setMessageHandler((message) => {
    handledMessages.push(toStandardMessageJson(message));
  });

  const mockSocket = {
    ev: mockEmitter,
    groupFetchAllParticipating: async () => ({
      '120363012345678901@g.us': {
        id: '120363012345678901@g.us',
        subject: 'Computer Department',
      },
      '120363098765432109@g.us': {
        id: '120363098765432109@g.us',
        subject: 'Random Alumni Group',
      },
    }),
    groupMetadata: async (jid: string) => ({
      id: jid,
      subject: jid.includes('678901') ? 'Computer Department' : 'Random Alumni Group',
    }),
  };

  await listener.start(mockSocket as never, createTestMessageUtils());
  assert(listener.isListening(), 'Message listener starts with an active socket');

  mockEmitter.emit('messages.upsert', {
    type: 'notify',
    messages: [
      createTextMessage({
        remoteJid: '120363012345678901@g.us',
        text: 'Approved group message',
        pushName: 'Faculty Member',
      }),
    ],
  });

  await new Promise((resolve) => setTimeout(resolve, 25));

  assert(handledMessages.length === 1, 'Allowed group text message is received');
  assert(
    handledMessages[0]?.groupName === 'Computer Department',
    'Standard message uses resolved group name',
  );
  assert(handledMessages[0]?.sender === 'Faculty Member', 'Standard message uses sender push name');
  assert(handledMessages[0]?.message === 'Approved group message', 'Standard message includes text body');
  assert(handledMessages[0]?.media === null, 'Standard message leaves media null');

  mockEmitter.emit('messages.upsert', {
    type: 'notify',
    messages: [
      createTextMessage({
        remoteJid: '919876543210@s.whatsapp.net',
        text: 'Private chat message',
        pushName: 'Student',
      }),
    ],
  });

  await new Promise((resolve) => setTimeout(resolve, 25));
  assert(handledMessages.length === 1, 'Private chat messages are ignored');

  mockEmitter.emit('messages.upsert', {
    type: 'notify',
    messages: [
      createTextMessage({
        remoteJid: '120363098765432109@g.us',
        text: 'Unknown group message',
        pushName: 'Alumni',
      }),
    ],
  });

  await new Promise((resolve) => setTimeout(resolve, 25));
  assert(handledMessages.length === 1, 'Unknown group messages are ignored');

  mockEmitter.emit('messages.upsert', {
    type: 'notify',
    messages: [createImageMessage('120363012345678901@g.us')],
  });

  await new Promise((resolve) => setTimeout(resolve, 25));
  assert(handledMessages.length === 1, 'Non-text messages are ignored');

  mockEmitter.emit('messages.upsert', {
    type: 'append',
    messages: [
      createTextMessage({
        remoteJid: '120363012345678901@g.us',
        text: 'Historical sync message',
        pushName: 'Faculty Member',
      }),
    ],
  });

  await new Promise((resolve) => setTimeout(resolve, 25));
  assert(handledMessages.length === 1, 'Historical append messages are ignored');

  listener.stop();
  assert(!listener.isListening(), 'Message listener stops cleanly');
  assert(handledMessages.length === 1, 'Only one approved text message is converted to standard JSON');
};

const testDefaultListenerInactive = async (): Promise<void> => {
  console.log('\n--- Default listener state ---');

  const { messageListener } = await import('../whatsapp/message.listener');
  messageListener.stop();
  assert(!messageListener.isListening(), 'Default message listener is inactive before connection');
};

const runTests = async (): Promise<void> => {
  console.log('Running WhatsApp message listener tests...');

  testMessageMapper();
  await testMessageListenerFiltering();
  await testDefaultListenerInactive();

  console.log('\nAll WhatsApp message listener tests passed.');
};

runTests().catch((error) => {
  console.error('\nWhatsApp message listener tests failed:', error);
  process.exit(1);
});
