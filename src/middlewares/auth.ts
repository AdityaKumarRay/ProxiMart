import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';
import type { TokenPayload } from '../modules/auth/auth.service.js';

/**
 * Extend Express Request to include the authenticated user payload.
 */
declare module 'express' {
  interface Request {
    user?: TokenPayload;
  }
}

/**
 * JWT authentication middleware.
 * Extracts and verifies the Bearer token from the Authorization header.
 * Attaches the decoded payload to `req.user`.
 *
 * @throws AppError 401 if token is missing, invalid, or expired
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    req.user = payload;
    next();
  } catch {
    logger.warn('JWT verification failed — invalid or expired token');
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }
}

/**
 * Role-based authorization middleware factory.
 * Must be used AFTER `authenticate` middleware.
 *
 * @param roles - Allowed roles for the route
 * @returns Express middleware that checks `req.user.role`
 *
 * @example
 * ```ts
 * router.get('/vendor-only', authenticate, authorize('VENDOR'), controller.fn);
 * ```
 */
export function authorize(...roles: Array<'VENDOR' | 'CUSTOMER'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        { userId: req.user.userId, role: req.user.role, requiredRoles: roles },
        'Authorization failed — insufficient role',
      );
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
}
