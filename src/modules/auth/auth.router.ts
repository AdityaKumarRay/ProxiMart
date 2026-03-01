import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { strictLimiter } from '../../middlewares/rateLimiter.js';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js';

const authController = new AuthController();

/**
 * Authentication router.
 * All auth routes use strict rate limiting (20 req / 15 min).
 *
 * Routes:
 * - POST /auth/register — create a new user
 * - POST /auth/login — authenticate and receive tokens
 * - POST /auth/refresh — refresh access token
 * - POST /auth/logout — invalidate refresh token (requires auth)
 */
const authRouter = Router();

authRouter.use(strictLimiter);

authRouter.post('/auth/register', validate(registerSchema), (req, res, next) => {
  authController.register(req, res).catch(next);
});

authRouter.post('/auth/login', validate(loginSchema), (req, res, next) => {
  authController.login(req, res).catch(next);
});

authRouter.post('/auth/refresh', validate(refreshSchema), (req, res, next) => {
  authController.refresh(req, res).catch(next);
});

authRouter.post('/auth/logout', authenticate, (req, res, next) => {
  authController.logout(req, res).catch(next);
});

export { authRouter };
