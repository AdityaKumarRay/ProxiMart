export { env } from './env.js';
export type { Env } from './env.js';

/** JWT token expiry durations */
export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';

/** Rate limit configuration */
export const RATE_LIMIT = {
  /** General: 100 requests per 15 minutes */
  GENERAL: { windowMs: 15 * 60 * 1000, max: 100 },
  /** Strict (auth routes): 20 requests per 15 minutes */
  STRICT: { windowMs: 15 * 60 * 1000, max: 20 },
} as const;

/** bcrypt cost factor */
export const BCRYPT_ROUNDS = 12;
