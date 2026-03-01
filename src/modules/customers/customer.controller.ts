import type { Request, Response } from 'express';
import { customerService } from './customer.service.js';
import { sendSuccess } from '../../utils/response.js';
import type { CreateCustomerProfileInput, UpdateCustomerProfileInput } from './customer.schema.js';

/**
 * Customer profile controller.
 * Handles HTTP request/response for customer profile endpoints.
 */
export class CustomerController {
  /**
   * Get the authenticated customer's profile.
   * @route GET /customers/profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const profile = await customerService.getProfile(userId);
    sendSuccess(res, profile, 'Customer profile retrieved');
  }

  /**
   * Create a customer profile for the authenticated user.
   * @route POST /customers/profile
   */
  async createProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const input = req.body as CreateCustomerProfileInput;
    const profile = await customerService.createProfile(userId, input);
    sendSuccess(res, profile, 'Customer profile created', 201);
  }

  /**
   * Update the authenticated customer's profile.
   * @route PATCH /customers/profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const input = req.body as UpdateCustomerProfileInput;
    const profile = await customerService.updateProfile(userId, input);
    sendSuccess(res, profile, 'Customer profile updated');
  }
}
