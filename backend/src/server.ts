import app from './app';
import { aiService } from './ai/services/ai.service';
import { connectDatabase, disconnectDatabase } from './database/connection';
import { env } from './config/env';
import { logger } from './utils/logger';
import { whatsappConnectionManager } from './whatsapp/connection.manager';
import { sessionService } from './whatsapp/session.service';
import { whatsappService } from './whatsapp/whatsapp.service';
import { eventCorrelationService } from './services/event-correlation.service';

let server: ReturnType<typeof app.listen> | undefined;

const startServer = async (): Promise<void> => {
  await connectDatabase();

  try {
    await aiService.initialize();
    logger.info('AI provider initialized');
  } catch (error) {
    logger.warn('AI provider initialization skipped or failed', { error });
  }

  server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`, { environment: env.NODE_ENV });
    void startWhatsAppIfConfigured();
  });
};

const startWhatsAppIfConfigured = async (): Promise<void> => {
  try {
    const hasStoredSession = await sessionService.hasStoredSession();
    if (!hasStoredSession) {
      logger.warn(
        'WhatsApp session not found. Run "npm run whatsapp:connect" (with backend stopped), scan QR, then restart backend.',
      );
      return;
    }

    await whatsappConnectionManager.start();
    logger.info('WhatsApp auto-connected using saved session');

    // Resume flush timers for WhatsApp sessions interrupted by server restart.
    void eventCorrelationService.recoverInterruptedSessions();

    // Start listener immediately and again after socket settles.
    await whatsappService.ensureMessageListenerActive();
    setTimeout(() => {
      void whatsappService.ensureMessageListenerActive();
    }, 3000);
  } catch (error) {
    logger.warn('WhatsApp auto-connect skipped or failed', { error });
  }
};

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  try {
    await whatsappConnectionManager.stop();
  } catch (error) {
    logger.warn('WhatsApp shutdown encountered an error', { error });
  }

  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server shut down successfully');
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

startServer().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
