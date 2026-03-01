import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../config/index.js';

/**
 * General rate limiter for all public routes.
 * 100 requests per 15-minute window.
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT.GENERAL.windowMs,
  max: RATE_LIMIT.GENERAL.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});

/**
 * Strict rate limiter for auth routes.
 * 20 requests per 15-minute window.
 */
export const strictLimiter = rateLimit({
  windowMs: RATE_LIMIT.STRICT.windowMs,
  max: RATE_LIMIT.STRICT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});
