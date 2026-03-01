import { z } from 'zod';

/**
 * Schema for creating a vendor profile.
 * All vendor-specific business details required at creation.
 */
export const createVendorProfileSchema = z.object({
  shopName: z
    .string()
    .min(1, 'Shop name is required')
    .max(200, 'Shop name must be at most 200 characters'),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  gstNumber: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GST number format')
    .optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  deliveryRadius: z
    .number()
    .min(0.5, 'Delivery radius must be at least 0.5 km')
    .max(50, 'Delivery radius must be at most 50 km')
    .optional(),
  isOpen: z.boolean().optional(),
  openingTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Opening time must be in HH:MM format')
    .optional(),
  closingTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Closing time must be in HH:MM format')
    .optional(),
});

/**
 * Schema for updating a vendor profile.
 * All fields are optional — only provided fields are updated.
 */
export const updateVendorProfileSchema = z.object({
  shopName: z
    .string()
    .min(1, 'Shop name is required')
    .max(200, 'Shop name must be at most 200 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .nullable(),
  address: z.string().min(1).max(500).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')
    .optional(),
  gstNumber: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GST number format')
    .optional()
    .nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  deliveryRadius: z.number().min(0.5).max(50).optional(),
  isOpen: z.boolean().optional(),
  openingTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Opening time must be in HH:MM format')
    .optional()
    .nullable(),
  closingTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Closing time must be in HH:MM format')
    .optional()
    .nullable(),
});

export type CreateVendorProfileInput = z.infer<typeof createVendorProfileSchema>;
export type UpdateVendorProfileInput = z.infer<typeof updateVendorProfileSchema>;
