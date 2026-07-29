/**
 * Interactive WhatsApp connect CLI.
 * Generates QR in terminal and waits for scan.
 *
 * Run: npm run whatsapp:connect
 *
 * IMPORTANT: Stop the backend (npm run dev) before running this script.
 * Only one process can connect to WhatsApp at a time.
 */

import net from 'net';
import dotenv from 'dotenv';
import { whatsappService } from '../whatsapp';

dotenv.config();

const BACKEND_PORT = Number(process.env.PORT ?? 5000);

const isPortInUse = (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const probe = net.createServer();

    probe.once('error', () => resolve(true));
    probe.once('listening', () => {
      probe.close(() => resolve(false));
    });

    probe.listen(port, '127.0.0.1');
  });

const run = async (): Promise<void> => {
  if (await isPortInUse(BACKEND_PORT)) {
    console.error('\nCannot generate QR while the backend is running on port', BACKEND_PORT);
    console.error('1. Stop the backend terminal (Ctrl+C on "npm run dev")');
    console.error('2. Run: npm run whatsapp:connect');
    console.error('3. Scan the QR code');
    console.error('4. Start the backend again: npm run dev\n');
    process.exit(1);
  }

  console.log('Starting WhatsApp connection...\n');

  whatsappService.enableAutoReconnect(false);
  await whatsappService.initialize();

  const status = await whatsappService.connect({
    displayQrInTerminal: true,
    connectionTimeoutMs: 180_000,
  });

  console.log('\nWhatsApp connected successfully.');
  console.log(`Session path: ${status.sessionPath}`);
  console.log(`Stored session: ${status.hasStoredSession ? 'yes' : 'no'}`);
  console.log('\nYou can now start the backend: npm run dev');

  await whatsappService.disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('\nWhatsApp connection failed:', error instanceof Error ? error.message : error);
  await whatsappService.disconnect().catch(() => undefined);
  process.exit(1);
});
