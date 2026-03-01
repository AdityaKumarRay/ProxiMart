import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import type { CreateVendorProfileInput, UpdateVendorProfileInput } from './vendor.schema.js';

/** Shape of vendor profile data returned to clients */
interface VendorProfileResponse {
  id: string;
  userId: string;
  shopName: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  deliveryRadius: number;
  isOpen: boolean;
  openingTime: string | null;
  closingTime: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vendor profile service.
 * Handles get, create, and update operations for vendor profiles.
 */
export class VendorService {
  /**
   * Get the authenticated vendor's profile.
   * @throws AppError 404 if profile does not exist
   */
  async getProfile(userId: string): Promise<VendorProfileResponse> {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      logger.warn({ userId }, 'Vendor profile not found');
      throw new AppError('Vendor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    logger.info({ userId }, 'Vendor profile retrieved');
    return profile;
  }

  /**
   * Create a vendor profile for the authenticated user.
   * @throws AppError 409 if profile already exists
   */
  async createProfile(
    userId: string,
    input: CreateVendorProfileInput,
  ): Promise<VendorProfileResponse> {
    const existing = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      logger.warn({ userId }, 'Vendor profile already exists');
      throw new AppError('Vendor profile already exists', 409, 'PROFILE_EXISTS');
    }

    const profile = await prisma.vendorProfile.create({
      data: {
        userId,
        shopName: input.shopName,
        description: input.description,
        address: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        gstNumber: input.gstNumber,
        latitude: input.latitude,
        longitude: input.longitude,
        deliveryRadius: input.deliveryRadius ?? 5.0,
        isOpen: input.isOpen ?? false,
        openingTime: input.openingTime,
        closingTime: input.closingTime,
      },
    });

    logger.info({ userId, profileId: profile.id }, 'Vendor profile created');
    return profile;
  }

  /**
   * Update the authenticated vendor's profile.
   * @throws AppError 404 if profile does not exist
   */
  async updateProfile(
    userId: string,
    input: UpdateVendorProfileInput,
  ): Promise<VendorProfileResponse> {
    const existing = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      logger.warn({ userId }, 'Vendor profile not found for update');
      throw new AppError('Vendor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    const profile = await prisma.vendorProfile.update({
      where: { userId },
      data: input,
    });

    logger.info({ userId, profileId: profile.id }, 'Vendor profile updated');
    return profile;
  }
}

export const vendorService = new VendorService();
