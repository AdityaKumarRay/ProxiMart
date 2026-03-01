import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client.js';
import { env } from '../../config/env.js';
import { BCRYPT_ROUNDS, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '../../config/index.js';
import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';

/** Payload embedded in JWT tokens */
export interface TokenPayload {
  userId: string;
  email: string;
  role: 'VENDOR' | 'CUSTOMER';
}

/** Shape of the data returned to clients after auth operations */
interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'VENDOR' | 'CUSTOMER';
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Authentication service.
 * Handles register, login, refresh, and logout business logic.
 */
export class AuthService {
  /**
   * Register a new user.
   * Hashes password with bcrypt and persists to DB.
   * @throws AppError 409 if email already exists
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      logger.warn({ email: input.email }, 'Registration attempt with existing email');
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        phone: input.phone,
        role: input.role,
      },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    logger.info({ userId: user.id, role: user.role }, 'User registered successfully');

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  /**
   * Authenticate a user with email and password.
   * @throws AppError 401 if credentials are invalid
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      logger.warn({ email: input.email }, 'Login attempt — user not found');
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      logger.warn({ userId: user.id }, 'Login attempt — account deactivated');
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      logger.warn({ email: input.email }, 'Login attempt — invalid password');
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    logger.info({ userId: user.id, role: user.role }, 'User logged in successfully');

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  /**
   * Refresh an access token using a valid refresh token.
   * @throws AppError 401 if refresh token is invalid or expired
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      logger.warn('Token refresh attempt — invalid or expired refresh token');
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== refreshToken) {
      logger.warn({ userId: payload.userId }, 'Token refresh — token mismatch or user not found');
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    if (!user.isActive) {
      logger.warn({ userId: user.id }, 'Token refresh — account deactivated');
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    logger.info({ userId: user.id }, 'Token refreshed successfully');

    return tokens;
  }

  /**
   * Logout a user by clearing their stored refresh token.
   * @throws AppError 401 if user not found
   */
  async logout(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    logger.info({ userId }, 'User logged out successfully');
  }

  /**
   * Generate JWT access and refresh token pair.
   * Access token: 15 minutes, Refresh token: 7 days.
   */
  private generateTokens(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRY,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRY,
    });

    return { accessToken, refreshToken };
  }
}
