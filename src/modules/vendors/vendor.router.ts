import { Router } from 'express';
import { VendorController } from './vendor.controller.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { generalLimiter } from '../../middlewares/rateLimiter.js';
import { createVendorProfileSchema, updateVendorProfileSchema } from './vendor.schema.js';

const vendorController = new VendorController();

/**
 * Vendor profile router.
 * All routes require authentication and VENDOR role.
 *
 * Routes:
 * - GET   /vendors/profile — get own vendor profile
 * - POST  /vendors/profile — create vendor profile
 * - PATCH /vendors/profile — update vendor profile
 */
const vendorRouter = Router();

vendorRouter.get(
  '/vendors/profile',
  generalLimiter,
  authenticate,
  authorize('VENDOR'),
  (req, res, next) => {
    vendorController.getProfile(req, res).catch(next);
  },
);

vendorRouter.post(
  '/vendors/profile',
  generalLimiter,
  authenticate,
  authorize('VENDOR'),
  validate(createVendorProfileSchema),
  (req, res, next) => {
    vendorController.createProfile(req, res).catch(next);
  },
);

vendorRouter.patch(
  '/vendors/profile',
  generalLimiter,
  authenticate,
  authorize('VENDOR'),
  validate(updateVendorProfileSchema),
  (req, res, next) => {
    vendorController.updateProfile(req, res).catch(next);
  },
);

export { vendorRouter };
