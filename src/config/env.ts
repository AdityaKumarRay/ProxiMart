import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Zod schema for validating all required environment variables.
 * Application fails fast on startup if any required variable is missing or invalid.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // RabbitMQ
  RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  // External Services
  SARVAM_API_KEY: z.string().min(1, 'SARVAM_API_KEY is required'),
  ML_SERVICE_URL: z.string().url('ML_SERVICE_URL must be a valid URL'),

  // CORS
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.format();
  // Using console.error here intentionally — logger is not yet initialized
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', JSON.stringify(formatted, null, 2));
  process.exit(1);
}

/** Validated and typed environment variables */
export const env: Env = parsed.data;
