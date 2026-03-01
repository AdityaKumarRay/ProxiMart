import type { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Send a standardized success response.
 * @param res - Express response object
 * @param data - Response payload
 * @param message - Human-readable success message
 * @param statusCode - HTTP status code (default 200)
 */
export function sendSuccess<T>(res: Response, data: T, message: string, statusCode = 200): void {
  const body: SuccessResponse<T> = { success: true, data, message };
  res.status(statusCode).json(body);
}

/**
 * Send a standardized error response.
 * @param res - Express response object
 * @param code - Machine-readable error code
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code (default 500)
 */
export function sendError(res: Response, code: string, message: string, statusCode = 500): void {
  const body: ErrorResponse = { success: false, error: { code, message } };
  res.status(statusCode).json(body);
}
