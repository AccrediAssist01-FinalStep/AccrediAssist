/**
 * Interactive WhatsApp connect CLI.
 * Generates QR in terminal and waits for scan.
 *
 * Run: npm run whatsapp:connect
 */

import dotenv from 'dotenv';
import { whatsappService } from '../whatsapp';

dotenv.config();

const run = async (): Promise<void> => {
  console.log('Starting WhatsApp connection...\n');

  await whatsappService.initialize();

  const status = await whatsappService.connect({
    displayQrInTerminal: true,
    connectionTimeoutMs: 180_000,
  });

  console.log('\nWhatsApp connected successfully.');
  console.log(`Session path: ${status.sessionPath}`);
  console.log(`Stored session: ${status.hasStoredSession ? 'yes' : 'no'}`);

  await whatsappService.disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('\nWhatsApp connection failed:', error);
  await whatsappService.disconnect().catch(() => undefined);
  process.exit(1);
});
