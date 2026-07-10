/**
 * WhatsApp QR authentication connection test.
 *
 * With saved session: reconnects automatically and verifies session reuse.
 * Without session: prints QR in terminal and waits for scan (interactive).
 *
 * QR-only check (no scan required):
 *   set WHATSAPP_TEST_QR_ONLY=true
 *   npm run test:whatsapp-connection
 *
 * Full interactive scan:
 *   npm run whatsapp:connect
 */

import dotenv from 'dotenv';
import {
  WhatsAppConnectionStatus,
  sessionService,
  whatsappService,
} from '../whatsapp';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const waitForQrCode = async (timeoutMs: number): Promise<string> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const qrCode = whatsappService.getQrCode();
    if (qrCode) {
      return qrCode;
    }

    await sleep(500);
  }

  throw new Error('Timed out waiting for WhatsApp QR code');
};

const testSessionReuse = async (): Promise<void> => {
  console.log('\n--- Session reuse ---');

  const firstStatus = await whatsappService.connect({
    displayQrInTerminal: false,
    connectionTimeoutMs: 60_000,
  });

  assert(firstStatus.isConnected, 'WhatsApp connects using saved session');
  assert(firstStatus.hasStoredSession, 'Stored session remains available');
  assert(!firstStatus.hasQrCode, 'Saved session does not require QR');

  await whatsappService.disconnect();

  const secondStatus = await whatsappService.connect({
    displayQrInTerminal: false,
    connectionTimeoutMs: 60_000,
  });

  assert(secondStatus.isConnected, 'WhatsApp reconnects after restart');
  assert(
    whatsappService.getStatus() === WhatsAppConnectionStatus.CONNECTED,
    'Connection status is connected after restart',
  );

  await whatsappService.disconnect();
};

const testQrAuthentication = async (interactive: boolean): Promise<void> => {
  console.log('\n--- QR authentication ---');

  const connectPromise = whatsappService
    .connect({
      displayQrInTerminal: true,
      connectionTimeoutMs: interactive ? 180_000 : 20_000,
    })
    .catch(() => undefined);

  const qrCode = await waitForQrCode(20_000);
  assert(qrCode.length > 0, 'WhatsApp QR code is generated');
  assert(
    whatsappService.getStatus() === WhatsAppConnectionStatus.AWAITING_QR ||
      whatsappService.getStatus() === WhatsAppConnectionStatus.CONNECTING,
    'WhatsApp status reflects QR authentication flow',
  );

  if (!interactive) {
    await whatsappService.disconnect();
    await connectPromise;
    assert(true, 'QR authentication flow verified without waiting for scan');
    return;
  }

  console.log('\nWaiting for QR scan...\n');
  const connectedStatus = await whatsappService.connect({
    displayQrInTerminal: true,
    connectionTimeoutMs: 180_000,
  });

  assert(connectedStatus.isConnected, 'WhatsApp connects after QR scan');
  assert(await sessionService.hasStoredSession(), 'Authentication state is saved to disk');

  await whatsappService.disconnect();
  await testSessionReuse();
};

const runTests = async (): Promise<void> => {
  console.log('Running WhatsApp connection tests...\n');

  await whatsappService.initialize();
  assert(await whatsappService.isBaileysAvailable(), 'Baileys is available');

  const hasStoredSession = await sessionService.hasStoredSession();
  const qrOnly = process.env.WHATSAPP_TEST_QR_ONLY === 'true';
  const interactive = !qrOnly && process.env.WHATSAPP_TEST_QR_ONLY !== 'true';

  if (hasStoredSession && !qrOnly) {
    await testSessionReuse();
  } else {
    await testQrAuthentication(interactive && !hasStoredSession);
  }

  console.log('\nAll WhatsApp connection tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nWhatsApp connection tests failed:', error);
  await whatsappService.disconnect().catch(() => undefined);
  process.exit(1);
});
