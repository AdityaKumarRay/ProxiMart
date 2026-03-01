import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { generalLimiter } from '../../middlewares/rateLimiter.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  recordPaymentSchema,
  orderIdParamSchema,
  listOrdersQuerySchema,
} from './order.schema.js';

const orderController = new OrderController();

/**
 * Order router.
 * Routes:
 * - POST   /orders                    — create order (customer only)
 * - GET    /orders                    — list orders (authenticated)
 * - GET    /orders/:orderId           — get order (authenticated)
 * - PATCH  /orders/:orderId/status    — update status (vendor only)
 * - PATCH  /orders/:orderId/cancel    — cancel order (customer only)
 * - POST   /orders/:orderId/payments  — record payment (authenticated)
 * - POST   /orders/:orderId/receipt   — generate receipt (vendor only)
 * - GET    /orders/:orderId/receipt   — get receipt (authenticated)
 */
const orderRouter = Router();

// --- Customer: create order ---

orderRouter.post(
  '/orders',
  generalLimiter,
  authenticate,
  authorize('CUSTOMER'),
  validate(createOrderSchema),
  (req, res, next) => {
    orderController.createOrder(req, res).catch(next);
  },
);

// --- Authenticated: list orders ---

orderRouter.get(
  '/orders',
  generalLimiter,
  authenticate,
  validate(listOrdersQuerySchema, 'query'),
  (req, res, next) => {
    orderController.listOrders(req, res).catch(next);
  },
);

// --- Authenticated: get single order ---

orderRouter.get(
  '/orders/:orderId',
  generalLimiter,
  authenticate,
  validate(orderIdParamSchema, 'params'),
  (req, res, next) => {
    orderController.getOrder(req, res).catch(next);
  },
);

// --- Vendor: update order status ---

orderRouter.patch(
  '/orders/:orderId/status',
  generalLimiter,
  authenticate,
  authorize('VENDOR'),
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderStatusSchema),
  (req, res, next) => {
    orderController.updateOrderStatus(req, res).catch(next);
  },
);

// --- Customer: cancel order ---

orderRouter.patch(
  '/orders/:orderId/cancel',
  generalLimiter,
  authenticate,
  authorize('CUSTOMER'),
  validate(orderIdParamSchema, 'params'),
  (req, res, next) => {
    orderController.cancelOrder(req, res).catch(next);
  },
);

// --- Authenticated: record payment ---

orderRouter.post(
  '/orders/:orderId/payments',
  generalLimiter,
  authenticate,
  validate(orderIdParamSchema, 'params'),
  validate(recordPaymentSchema),
  (req, res, next) => {
    orderController.recordPayment(req, res).catch(next);
  },
);

// --- Vendor: generate receipt ---

orderRouter.post(
  '/orders/:orderId/receipt',
  generalLimiter,
  authenticate,
  authorize('VENDOR'),
  validate(orderIdParamSchema, 'params'),
  (req, res, next) => {
    orderController.generateReceipt(req, res).catch(next);
  },
);

// --- Authenticated: get receipt ---

orderRouter.get(
  '/orders/:orderId/receipt',
  generalLimiter,
  authenticate,
  validate(orderIdParamSchema, 'params'),
  (req, res, next) => {
    orderController.getReceipt(req, res).catch(next);
  },
);

export { orderRouter };
