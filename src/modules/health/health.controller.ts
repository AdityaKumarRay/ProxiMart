import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';

/**
 * Health check controller.
 * Returns server status, uptime, and current timestamp.
 *
 * @route GET /health
 */
export function getHealth(_req: Request, res: Response): void {
  sendSuccess(
    res,
    {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    'Server is healthy',
  );
}
