import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import type { RegisterInput, LoginInput, RefreshInput } from './auth.schema.js';

const authService = new AuthService();

/**
 * Auth controller.
 * Handles HTTP request/response for authentication endpoints.
 */
export class AuthController {
  /**
   * Register a new user (vendor or customer).
   * @route POST /auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    const input = req.body as RegisterInput;
    const result = await authService.register(input);
    sendSuccess(res, result, 'User registered successfully', 201);
  }

  /**
   * Login with email and password.
   * @route POST /auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    const input = req.body as LoginInput;
    const result = await authService.login(input);
    sendSuccess(res, result, 'Login successful');
  }

  /**
   * Refresh access token using a valid refresh token.
   * @route POST /auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as RefreshInput;
    const tokens = await authService.refresh(refreshToken);
    sendSuccess(res, tokens, 'Token refreshed successfully');
  }

  /**
   * Logout — invalidates the refresh token.
   * @route POST /auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      sendSuccess(res, null, 'Logged out');
      return;
    }
    await authService.logout(userId);
    sendSuccess(res, null, 'Logged out successfully');
  }
}
