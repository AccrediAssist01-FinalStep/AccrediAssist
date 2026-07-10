import app from './app';
import { connectDatabase, disconnectDatabase } from './database/connection';
import { env } from './config/env';
import { logger } from './utils/logger';

let server: ReturnType<typeof app.listen> | undefined;

const startServer = async (): Promise<void> => {
  await connectDatabase();

  server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`, { environment: env.NODE_ENV });
  });
};

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

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
