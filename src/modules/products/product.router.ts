import { Router } from 'express';
import { ProductController } from './product.controller.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { generalLimiter } from '../../middlewares/rateLimiter.js';
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
} from './product.schema.js';

const productController = new ProductController();

/**
 * Product router.
 * Routes:
 * - GET    /products           — list products (public, filtered)
 * - GET    /products/low-stock — low-stock alerts (vendor only)
 * - GET    /products/:productId — get single product (public)
 * - POST   /products           — create product (vendor only)
 * - PATCH  /products/:productId — update product (vendor only)
 * - DELETE /products/:productId — delete product (vendor only)
 */
const productRouter = Router();

// --- Public routes ---

productRouter.get(
  '/products',
  generalLimiter,
  validate(listProductsQuerySchema, 'query'),
  (req, res, next) => {
    productController.listProducts(req, res).catch(next);
  },
);

// --- Vendor-only routes (must come before :productId param route) ---

productRouter.get(
  '/products/low-stock',
  generalLimiter,
  authenticate,
  authorize('VENDOR'),
  (req, res, next) => {
    productController.getLowStockProducts(req, res).catch(next);
  },
);

productRouter.post(
  '/products',
  generalLimiter,
  authenticate,
  authorize('VENDOR'),
  validate(createProductSchema),
  (req, res, next) => {
    productController.createProduct(req, res).catch(next);
  },
);

// --- Public param route ---

productRouter.get(
  '/products/:productId',
  generalLimiter,
  validate(productIdParamSchema, 'params'),
  (req, res, next) => {
    productController.getProduct(req, res).catch(next);
  },
);

// --- Vendor-only param routes ---

productRouter.patch(
  '/products/:productId',
  generalLimiter,
  authenticate,
  authorize('VENDOR'),
  validate(productIdParamSchema, 'params'),
  validate(updateProductSchema),
  (req, res, next) => {
    productController.updateProduct(req, res).catch(next);
  },
);

productRouter.delete(
  '/products/:productId',
  generalLimiter,
  authenticate,
  authorize('VENDOR'),
  validate(productIdParamSchema, 'params'),
  (req, res, next) => {
    productController.deleteProduct(req, res).catch(next);
  },
);

export { productRouter };
