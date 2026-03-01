import type { Request, Response } from 'express';
import { vendorService } from './vendor.service.js';
import { sendSuccess } from '../../utils/response.js';
import type { CreateVendorProfileInput, UpdateVendorProfileInput } from './vendor.schema.js';

/**
 * Vendor profile controller.
 * Handles HTTP request/response for vendor profile endpoints.
 */
export class VendorController {
  /**
   * Get the authenticated vendor's profile.
   * @route GET /vendors/profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const profile = await vendorService.getProfile(userId);
    sendSuccess(res, profile, 'Vendor profile retrieved');
  }

  /**
   * Create a vendor profile for the authenticated user.
   * @route POST /vendors/profile
   */
  async createProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const input = req.body as CreateVendorProfileInput;
    const profile = await vendorService.createProfile(userId, input);
    sendSuccess(res, profile, 'Vendor profile created', 201);
  }

  /**
   * Update the authenticated vendor's profile.
   * @route PATCH /vendors/profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const input = req.body as UpdateVendorProfileInput;
    const profile = await vendorService.updateProfile(userId, input);
    sendSuccess(res, profile, 'Vendor profile updated');
  }
}
