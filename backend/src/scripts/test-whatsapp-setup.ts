/**
 * WhatsApp integration setup tests.
 *
 * Verifies Baileys installation, module skeleton, and configuration.
 * Does NOT connect to WhatsApp or generate a QR code.
 *
 * Run: npm run test:whatsapp-setup
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import {
  WhatsAppConnectionStatus,
  baileysConfig,
  groupFilter,
  isBaileysAvailable,
  messageListener,
  sessionService,
  whatsappConfig,
  whatsappService,
} from '../whatsapp';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const runTests = async (): Promise<void> => {
  console.log('Running WhatsApp setup tests...\n');

  assert(await isBaileysAvailable(), 'Baileys module loads via dynamic import');
  assert(await whatsappService.isBaileysAvailable(), 'WhatsAppService detects Baileys availability');

  assert(Boolean(process.env.WHATSAPP_SESSION_PATH), 'WHATSAPP_SESSION_PATH is configured');
  assert(Boolean(process.env.WHATSAPP_ALLOWED_GROUPS), 'WHATSAPP_ALLOWED_GROUPS is configured');

  assert(whatsappConfig.sessionPath.length > 0, 'WhatsApp session path is resolved');
  assert(whatsappConfig.allowedGroups.length > 0, 'Allowed groups are loaded from env');
  assert(baileysConfig.printQRInTerminal === false, 'Baileys QR printing is disabled');

  assert(
    groupFilter.isAllowedGroup('Computer Department'),
    'Group filter allows configured group',
  );
  assert(!groupFilter.isAllowedGroup('Unknown Group'), 'Group filter rejects unknown group');

  const sessionPath = await sessionService.ensureSessionDirectory();
  await fs.access(sessionPath);
  assert(true, 'Session directory is created');

  const moduleStatus = await whatsappService.initialize();
  assert(
    moduleStatus.status === WhatsAppConnectionStatus.DISCONNECTED,
    'WhatsApp module starts in disconnected state',
  );
  assert(moduleStatus.sessionPath === sessionPath, 'Module status exposes session path');
  assert(
    moduleStatus.allowedGroups.length === whatsappConfig.allowedGroups.length,
    'Module status exposes allowed groups',
  );
  assert(
    typeof moduleStatus.hasStoredSession === 'boolean',
    'Module status reports stored session state',
  );
  assert(moduleStatus.isConnected === false, 'Module is not connected after initialize');
  assert(moduleStatus.hasQrCode === false, 'Module has no QR code after initialize');
  assert(!messageListener.isListening(), 'Message listener is not active');

  const credentialsPath = path.join(sessionPath, 'creds.json');
  const hasCredentials = await sessionService.hasStoredSession();
  if (!hasCredentials) {
    try {
      await fs.access(credentialsPath);
      assert(false, 'Missing credentials file should not exist yet');
    } catch {
      assert(true, 'No WhatsApp session credentials are present yet');
    }
  } else {
    assert(true, 'Existing WhatsApp session credentials detected');
  }

  console.log('\nAll WhatsApp setup tests passed.');
};

runTests().catch((error) => {
  console.error('\nWhatsApp setup tests failed:', error);
  process.exit(1);
});
