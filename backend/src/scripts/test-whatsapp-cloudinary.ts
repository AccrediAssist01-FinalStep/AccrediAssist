/**
 * WhatsApp Cloudinary integration tests.
 *
 * Verifies media upload, secure URL storage, and temp file cleanup.
 * Does NOT invoke the AI pipeline.
 *
 * Run: npm run test:whatsapp-cloudinary
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { CloudinaryService } from '../services/cloudinary.service';
import { MessageListener } from '../whatsapp/message.listener';
import {
  createTestMessageUtils,
  detectSupportedMedia,
  toStandardMessageJson,
} from '../whatsapp/message.mapper';
import { MediaService } from '../whatsapp/media.service';
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

const withTempMediaPath = async <T>(
  prefix: string,
  run: (tempRoot: string) => Promise<T>,
): Promise<T> => {
  const tempRoot = path.join(mediaConfig.tempPath, `${prefix}-${Date.now()}`);
  const originalTempPath = mediaConfig.tempPath;

  Object.defineProperty(mediaConfig, 'tempPath', {
    configurable: true,
    value: tempRoot,
  });

  try {
    return await run(tempRoot);
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

const testCloudinaryServiceUpload = async (): Promise<void> => {
  console.log('\n--- Cloudinary service upload ---');

  const cloudinaryService = new CloudinaryService(async (input) => ({
    secureUrl: `https://res.cloudinary.com/demo/image/upload/v1/${input.fileName}`,
    publicId: `accrediassist/whatsapp/${input.fileName}`,
    resourceType: input.mediaType === 'image' ? 'image' : 'raw',
    bytes: 128,
  }));

  const result = await cloudinaryService.uploadWhatsAppMedia({
    filePath: '/tmp/sample.pdf',
    fileName: 'sample.pdf',
    mediaType: 'pdf',
  });

  assert(result.secureUrl.startsWith('https://'), 'Cloudinary upload returns a secure URL');
  assert(result.publicId.includes('accrediassist/whatsapp'), 'Cloudinary upload stores folder-based public ID');
};

const testMediaUploadPipeline = async (): Promise<void> => {
  console.log('\n--- Media upload pipeline ---');

  await withTempMediaPath('cloudinary-pipeline', async (tempRoot) => {
    const utils = createTestMessageUtils();
    const groupJid = '120363012345678901@g.us';
    const uploads: string[] = [];

    const mediaService = new MediaService(
      async (message) => {
        if (message.key.id === 'TEST_PDF_ID') {
          return Buffer.from('%PDF-1.4 test pdf');
        }
        return Buffer.from('image-bytes');
      },
      async (input) => {
        uploads.push(input.filePath);
        return {
          secureUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/offer-letter.pdf',
          publicId: 'accrediassist/whatsapp/offer-letter.pdf',
          resourceType: 'raw',
          bytes: input.fileName.length,
        };
      },
    );

    const message = createPdfMessage(groupJid);
    const mediaInfo = detectSupportedMedia(message, utils);

    if (!mediaInfo) {
      throw new Error('Expected PDF media info');
    }

    const processed = await mediaService.processIncomingMedia({
      message,
      socket: {} as never,
      mediaInfo,
    });

    assert(uploads.length === 1, 'Downloaded media is uploaded to Cloudinary');
    assert(
      processed.secureUrl.startsWith('https://res.cloudinary.com/'),
      'Processed media exposes secure Cloudinary URL',
    );
    assert(processed.metadata.secureUrl === processed.secureUrl, 'Metadata stores secure URL');
    assert(Boolean(processed.metadata.publicId), 'Metadata stores Cloudinary public ID');
    assert(!processed.metadata.localPath, 'Metadata no longer exposes local temp path');
    await assertFileMissing(uploads[0]!, 'Temporary file is deleted after Cloudinary upload');
  });
};

const testListenerCloudinaryIntegration = async (): Promise<void> => {
  console.log('\n--- Listener Cloudinary integration ---');

  await withTempMediaPath('cloudinary-listener', async () => {
    const listener = new MessageListener();
    const mockEmitter = new MockEventEmitter();
    const utils = createTestMessageUtils();
    const received: ReturnType<typeof toStandardMessageJson>[] = [];
    const groupJid = '120363012345678901@g.us';

    const { mediaService: singletonMediaService } = await import('../whatsapp/media.service');
    const originalDownload = singletonMediaService['downloadBuffer'].bind(singletonMediaService);
    const originalUpload = singletonMediaService['uploadToCloudinary'].bind(singletonMediaService);

    singletonMediaService['downloadBuffer'] = async () => Buffer.from('%PDF-1.4 listener pdf');
    singletonMediaService['uploadToCloudinary'] = async () => ({
      secureUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/listener-offer-letter.pdf',
      publicId: 'accrediassist/whatsapp/listener-offer-letter.pdf',
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

      assert(received.length === 1, 'Listener processes media messages through Cloudinary');
      assert(
        received[0]?.media === 'https://res.cloudinary.com/demo/raw/upload/v1/listener-offer-letter.pdf',
        'Standard message stores secure Cloudinary URL in media field',
      );
      assert(
        received[0]?.mediaMetadata?.secureUrl === received[0]?.media,
        'Media metadata mirrors secure Cloudinary URL',
      );
      assert(Boolean(received[0]?.mediaMetadata?.publicId), 'Media metadata includes Cloudinary public ID');
    } finally {
      singletonMediaService['downloadBuffer'] = originalDownload;
      singletonMediaService['uploadToCloudinary'] = originalUpload;
      listener.stop();
    }
  });
};

const runTests = async (): Promise<void> => {
  console.log('Running WhatsApp Cloudinary integration tests...');

  await testCloudinaryServiceUpload();
  await testMediaUploadPipeline();
  await testListenerCloudinaryIntegration();

  console.log('\nAll WhatsApp Cloudinary integration tests passed.');
};

runTests().catch((error) => {
  console.error('\nWhatsApp Cloudinary integration tests failed:', error);
  process.exit(1);
});
