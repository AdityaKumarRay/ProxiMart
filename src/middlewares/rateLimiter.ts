import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { RATE_LIMIT } from '../config/index.js';

const isTest = process.env['NODE_ENV'] === 'test';

/** No-op middleware that passes through — used in test environment */
function noopLimiter(_req: Request, _res: Response, next: NextFunction): void {
  next();
}

/**
 * General rate limiter for all public routes.
 * 100 requests per 15-minute window.
 * Bypassed in test environment.
 */
export const generalLimiter = isTest
  ? noopLimiter
  : rateLimit({
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
 * Bypassed in test environment.
 */
export const strictLimiter = isTest
  ? noopLimiter
  : rateLimit({
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
