import { z } from 'zod';

/**
 * Zod schema for user registration.
 * Validates email, password strength, name, optional phone, and role.
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 characters')
    .max(15, 'Phone must be at most 15 characters')
    .optional(),
  role: z.enum(['VENDOR', 'CUSTOMER'], {
    message: 'Role must be VENDOR or CUSTOMER',
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Zod schema for user login.
 * Validates email and password.
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Zod schema for token refresh.
 * Validates that a refresh token string is provided.
 */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshInput = z.infer<typeof refreshSchema>;
