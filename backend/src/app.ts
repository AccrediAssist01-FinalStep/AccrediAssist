import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import apiRouter from './routes';
import { httpLogger } from './middleware/logger.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { getDatabaseStatus } from './database/connection';

const app: Application = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// Request logging
app.use(httpLogger);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'AccrediAssist API is running',
    data: {
      environment: env.NODE_ENV,
      database: getDatabaseStatus(),
      timestamp: new Date().toISOString(),
    },
  });
});

// API routes (registered in later sprints)
app.use('/api/v1', apiRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
