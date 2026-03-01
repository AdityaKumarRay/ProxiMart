import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../utils/appError.js';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Factory that returns an Express middleware validating the specified
 * request property against a Zod schema.
 *
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (default: 'body')
 * @returns Express middleware
 *
 * @example
 * ```ts
 * router.post('/register', validate(registerSchema), controller.register);
 * ```
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const zodError = result.error;
      const message = zodError.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');

      throw new AppError(message, 400, 'VALIDATION_ERROR');
    }

    // Replace the target with parsed (and potentially transformed) data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Object.defineProperty(req, target, { value: result.data, writable: true });
    next();
  };
}
