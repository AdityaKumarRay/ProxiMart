/**
 * Custom application error class for operational errors.
 * Extends the native Error with HTTP status code, error code string,
 * and an operational flag to distinguish from programming bugs.
 */
export class AppError extends Error {
  /** HTTP status code (e.g. 400, 404, 500) */
  public readonly statusCode: number;

  /** Machine-readable error code (e.g. USER_NOT_FOUND) */
  public readonly code: string;

  /** Whether this is an expected operational error (vs a programming bug) */
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
