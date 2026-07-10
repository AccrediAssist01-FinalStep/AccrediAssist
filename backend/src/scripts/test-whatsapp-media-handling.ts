/**
 * WhatsApp media handling tests.
 *
 * Verifies image, PDF, and document downloads, temporary storage,
 * and media metadata responses. Does NOT upload to Cloudinary.
 *
 * Run: npm run test:whatsapp-media-handling
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { MessageListener } from '../whatsapp/message.listener';
import {
  createTestMessageUtils,
  detectSupportedMedia,
  extractMediaCaption,
  toStandardMessageJson,
} from '../whatsapp/message.mapper';
import { MediaService, resolveMediaType } from '../whatsapp/media.service';
import { mediaConfig } from '../whatsapp/whatsapp.config';

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

const createImageMessage = (remoteJid: string): WAMessage => ({
  key: {
    remoteJid,
    fromMe: false,
    id: 'TEST_IMAGE_ID',
  },
  message: {
    imageMessage: {
      mimetype: 'image/jpeg',
      caption: 'Placement photo attached',
    },
  },
  messageTimestamp: 1_722_000_000,
  pushName: 'Placement Officer',
});

const createPdfMessage = (remoteJid: string): WAMessage => ({
  key: {
    remoteJid,
    fromMe: false,
    id: 'TEST_PDF_ID',
  },
  message: {
    documentMessage: {
      mimetype: 'application/pdf',
      fileName: 'offer-letter.pdf',
      caption: 'Offer letter attached',
    },
  },
  messageTimestamp: 1_722_000_100,
  pushName: 'HR Team',
});

const createDocumentMessage = (remoteJid: string): WAMessage => ({
  key: {
    remoteJid,
    fromMe: false,
    id: 'TEST_DOC_ID',
  },
  message: {
    documentMessage: {
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileName: 'project-report.docx',
    },
  },
  messageTimestamp: 1_722_000_200,
  pushName: 'Faculty Member',
});

const createVideoMessage = (remoteJid: string): WAMessage => ({
  key: {
    remoteJid,
    fromMe: false,
    id: 'TEST_VIDEO_ID',
  },
  message: {
    videoMessage: {
      mimetype: 'video/mp4',
      caption: 'Unsupported video',
    },
  },
  messageTimestamp: 1_722_000_300,
  pushName: 'Student',
});

const testMediaDetection = (): void => {
  console.log('\n--- Media detection ---');

  const utils = createTestMessageUtils();
  const groupJid = '120363012345678901@g.us';

  const imageMedia = detectSupportedMedia(createImageMessage(groupJid), utils);
  assert(imageMedia?.mediaType === 'image', 'Image messages are detected');
  assert(imageMedia?.mimeType === 'image/jpeg', 'Image mime type is captured');

  const pdfMedia = detectSupportedMedia(createPdfMessage(groupJid), utils);
  assert(pdfMedia?.mediaType === 'pdf', 'PDF messages are detected');
  assert(pdfMedia?.fileName === 'offer-letter.pdf', 'PDF file name is captured');

  const documentMedia = detectSupportedMedia(createDocumentMessage(groupJid), utils);
  assert(documentMedia?.mediaType === 'document', 'Document messages are detected');

  assert(detectSupportedMedia(createVideoMessage(groupJid), utils) === null, 'Unsupported media types are ignored');
  assert(resolveMediaType('video/mp4') === null, 'Video mime types are not supported');

  const caption = extractMediaCaption(createPdfMessage(groupJid), utils);
  assert(caption === 'Offer letter attached', 'Media captions are extracted');
};

const testMediaDownloadAndMetadata = async (): Promise<void> => {
  console.log('\n--- Media download and metadata ---');

  const utils = createTestMessageUtils();
  const groupJid = '120363012345678901@g.us';
  const tempRoot = path.join(mediaConfig.tempPath, `test-${Date.now()}`);
  const originalTempPath = mediaConfig.tempPath;

  Object.defineProperty(mediaConfig, 'tempPath', {
    configurable: true,
    value: tempRoot,
  });

  const payloads: Record<string, Buffer> = {
    TEST_IMAGE_ID: Buffer.from('fake-image-bytes'),
    TEST_PDF_ID: Buffer.from('%PDF-1.4 fake pdf content'),
    TEST_DOC_ID: Buffer.from('fake-docx-bytes'),
  };

  const mediaService = new MediaService(async (message) => {
    const messageId = message.key.id ?? '';
    const payload = payloads[messageId];

    if (!payload) {
      throw new Error(`Unexpected media download for ${messageId}`);
    }

    return payload;
  });

  const mockSocket = {} as never;

  try {
    for (const [label, factory] of [
      ['image', createImageMessage],
      ['pdf', createPdfMessage],
      ['document', createDocumentMessage],
    ] as const) {
      const message = factory(groupJid);
      const mediaInfo = detectSupportedMedia(message, utils);

      if (!mediaInfo) {
        throw new Error(`Missing media info for ${label}`);
      }

      const metadata = await mediaService.downloadAndSave({
        message,
        socket: mockSocket,
        mediaInfo,
      });

      assert(metadata.mediaType === mediaInfo.mediaType, `${label} metadata includes media type`);
      assert(metadata.mimeType === mediaInfo.mimeType, `${label} metadata includes mime type`);
      assert(metadata.fileName === mediaInfo.fileName, `${label} metadata includes file name`);
      assert(metadata.fileSize > 0, `${label} metadata includes file size`);
      assert(metadata.localPath.startsWith(tempRoot), `${label} metadata includes temp local path`);
      assert(Boolean(metadata.tempFileId), `${label} metadata includes temp file id`);
      assert(metadata.downloadedAt instanceof Date, `${label} metadata includes downloadedAt`);

      const fileContents = await fs.readFile(metadata.localPath);
      assert(fileContents.equals(payloads[message.key.id ?? '']), `${label} file is saved temporarily`);

      await mediaService.deleteTempMedia(metadata.tempFileId);
      await assertFileMissing(metadata.localPath, `${label} temp file is deleted after cleanup`);
    }
  } finally {
    Object.defineProperty(mediaConfig, 'tempPath', {
      configurable: true,
      value: originalTempPath,
    });
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
};

const assertFileMissing = async (filePath: string, message: string): Promise<void> => {
  try {
    await fs.access(filePath);
    throw new Error(`FAIL: ${message}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('FAIL:')) {
      throw error;
    }
    assert(true, message);
  }
};

const testListenerMediaIntegration = async (): Promise<void> => {
  console.log('\n--- Listener media integration ---');

  const listener = new MessageListener();
  const mockEmitter = new MockEventEmitter();
  const utils = createTestMessageUtils();
  const received: ReturnType<typeof toStandardMessageJson>[] = [];
  const groupJid = '120363012345678901@g.us';
  const tempRoot = path.join(mediaConfig.tempPath, `listener-test-${Date.now()}`);
  const originalTempPath = mediaConfig.tempPath;

  Object.defineProperty(mediaConfig, 'tempPath', {
    configurable: true,
    value: tempRoot,
  });

  const { mediaService: singletonMediaService } = await import('../whatsapp/media.service');
  const originalDownload = singletonMediaService['downloadBuffer'].bind(singletonMediaService);
  const originalUpload = singletonMediaService['uploadToCloudinary'].bind(singletonMediaService);

  singletonMediaService['downloadBuffer'] = async (message) => {
    if (message.key.id === 'TEST_PDF_ID') {
      return Buffer.from('%PDF-1.4 listener pdf');
    }

    return Buffer.from('listener-image-bytes');
  };
  singletonMediaService['uploadToCloudinary'] = async () => ({
    secureUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/offer-letter.pdf',
    publicId: 'accrediassist/whatsapp/offer-letter.pdf',
    resourceType: 'raw',
    bytes: 21,
  });

  listener.setMessageHandler((message) => {
    received.push(toStandardMessageJson(message));
  });

  const mockSocket = {
    ev: mockEmitter,
    groupFetchAllParticipating: async () => ({
      [groupJid]: {
        id: groupJid,
        subject: 'Computer Department',
      },
    }),
    groupMetadata: async () => ({
      id: groupJid,
      subject: 'Computer Department',
    }),
  };

  try {
    await listener.start(mockSocket as never, utils);

    mockEmitter.emit('messages.upsert', {
      type: 'notify',
      messages: [createPdfMessage(groupJid)],
    });

    await new Promise((resolve) => setTimeout(resolve, 25));

    assert(received.length === 1, 'Listener processes approved group media messages');
    assert(
      received[0]?.media === 'https://res.cloudinary.com/demo/raw/upload/v1/offer-letter.pdf',
      'Standard message stores secure Cloudinary URL',
    );
    assert(received[0]?.mediaMetadata?.mediaType === 'pdf', 'Listener attaches media metadata');
    assert(received[0]?.message === 'Offer letter attached', 'Listener uses media caption as message text');
  } finally {
    singletonMediaService['downloadBuffer'] = originalDownload;
    singletonMediaService['uploadToCloudinary'] = originalUpload;
    listener.stop();
    Object.defineProperty(mediaConfig, 'tempPath', {
      configurable: true,
      value: originalTempPath,
    });
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
};

const runTests = async (): Promise<void> => {
  console.log('Running WhatsApp media handling tests...');

  testMediaDetection();
  await testMediaDownloadAndMetadata();
  await testListenerMediaIntegration();

  console.log('\nAll WhatsApp media handling tests passed.');
};

runTests().catch((error) => {
  console.error('\nWhatsApp media handling tests failed:', error);
  process.exit(1);
});
