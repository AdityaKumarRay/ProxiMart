import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';

/**
 * Centralized Express error handling middleware.
 * Catches AppError instances and returns structured error responses.
 * Unknown errors are logged and a generic 500 is returned — no stack trace leakage.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn(
      { statusCode: err.statusCode, code: err.code, message: err.message },
      'Operational error',
    );
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Unexpected / programming error
  logger.error({ err }, 'Unexpected error');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
