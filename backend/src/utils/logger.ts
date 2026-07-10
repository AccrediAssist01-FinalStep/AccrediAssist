import { env } from '../config/env';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[env.LOG_LEVEL];

const formatMessage = (level: LogLevel, message: string, meta?: unknown): string => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (meta !== undefined) {
    return `${base} ${JSON.stringify(meta)}`;
  }

  return base;
};

const log = (level: LogLevel, message: string, meta?: unknown): void => {
  if (LOG_LEVELS[level] > currentLevel) {
    return;
  }

  const formatted = formatMessage(level, message, meta);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
};

export const logger = {
  error: (message: string, meta?: unknown) => log('error', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  info: (message: string, meta?: unknown) => log('info', message, meta),
  debug: (message: string, meta?: unknown) => log('debug', message, meta),
};
