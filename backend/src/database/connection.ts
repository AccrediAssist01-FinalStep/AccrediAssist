import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../utils/logger';

mongoose.set('strictQuery', true);

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};

export const getDatabaseStatus = (): string => {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return states[mongoose.connection.readyState] ?? 'unknown';
};

mongoose.connection.on('connected', () => {
  logger.debug('MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB runtime error', error);
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});
