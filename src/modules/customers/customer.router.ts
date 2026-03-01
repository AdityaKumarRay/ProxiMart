import { Router } from 'express';
import { CustomerController } from './customer.controller.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { generalLimiter } from '../../middlewares/rateLimiter.js';
import { createCustomerProfileSchema, updateCustomerProfileSchema } from './customer.schema.js';

const customerController = new CustomerController();

/**
 * Customer profile router.
 * All routes require authentication and CUSTOMER role.
 *
 * Routes:
 * - GET   /customers/profile — get own customer profile
 * - POST  /customers/profile — create customer profile
 * - PATCH /customers/profile — update customer profile
 */
const customerRouter = Router();

customerRouter.get(
  '/customers/profile',
  generalLimiter,
  authenticate,
  authorize('CUSTOMER'),
  (req, res, next) => {
    customerController.getProfile(req, res).catch(next);
  },
);

customerRouter.post(
  '/customers/profile',
  generalLimiter,
  authenticate,
  authorize('CUSTOMER'),
  validate(createCustomerProfileSchema),
  (req, res, next) => {
    customerController.createProfile(req, res).catch(next);
  },
);

customerRouter.patch(
  '/customers/profile',
  generalLimiter,
  authenticate,
  authorize('CUSTOMER'),
  validate(updateCustomerProfileSchema),
  (req, res, next) => {
    customerController.updateProfile(req, res).catch(next);
  },
);

export { customerRouter };
