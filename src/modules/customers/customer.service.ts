import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import type { CreateCustomerProfileInput, UpdateCustomerProfileInput } from './customer.schema.js';

/** Shape of customer profile data returned to clients */
interface CustomerProfileResponse {
  id: string;
  userId: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer profile service.
 * Handles get, create, and update operations for customer profiles.
 */
export class CustomerService {
  /**
   * Get the authenticated customer's profile.
   * @throws AppError 404 if profile does not exist
   */
  async getProfile(userId: string): Promise<CustomerProfileResponse> {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      logger.warn({ userId }, 'Customer profile not found');
      throw new AppError('Customer profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    logger.info({ userId }, 'Customer profile retrieved');
    return profile;
  }

  /**
   * Create a customer profile for the authenticated user.
   * @throws AppError 409 if profile already exists
   */
  async createProfile(
    userId: string,
    input: CreateCustomerProfileInput,
  ): Promise<CustomerProfileResponse> {
    const existing = await prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      logger.warn({ userId }, 'Customer profile already exists');
      throw new AppError('Customer profile already exists', 409, 'PROFILE_EXISTS');
    }

    const profile = await prisma.customerProfile.create({
      data: {
        userId,
        address: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    });

    logger.info({ userId, profileId: profile.id }, 'Customer profile created');
    return profile;
  }

  /**
   * Update the authenticated customer's profile.
   * @throws AppError 404 if profile does not exist
   */
  async updateProfile(
    userId: string,
    input: UpdateCustomerProfileInput,
  ): Promise<CustomerProfileResponse> {
    const existing = await prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      logger.warn({ userId }, 'Customer profile not found for update');
      throw new AppError('Customer profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    const profile = await prisma.customerProfile.update({
      where: { userId },
      data: input,
    });

    logger.info({ userId, profileId: profile.id }, 'Customer profile updated');
    return profile;
  }
}

export const customerService = new CustomerService();
