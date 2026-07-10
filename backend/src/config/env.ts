import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const logLevelSchema = z.enum(['error', 'warn', 'info', 'debug']);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  LOG_LEVEL: logLevelSchema.default('info'),

  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Authentication
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // AI (required in later sprints)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_API_BASE_URL: z.string().url().default('https://api.openai.com/v1'),

  // Cloudinary (required in later sprints)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // WhatsApp (required in later sprints)
  WHATSAPP_SESSION_PATH: z.string().default('./sessions'),
  WHATSAPP_ALLOWED_GROUPS: z.string().default(''),

  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const whatsappAllowedGroups = env.WHATSAPP_ALLOWED_GROUPS.split(',')
  .map((group) => group.trim())
  .filter(Boolean);
