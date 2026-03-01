import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { generalLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { healthRouter } from './modules/health/health.router.js';
import { authRouter } from './modules/auth/auth.router.js';
import { vendorRouter } from './modules/vendors/vendor.router.js';
import { customerRouter } from './modules/customers/customer.router.js';
import { productRouter } from './modules/products/product.router.js';
import { AppError } from './utils/appError.js';

/**
 * Express application setup.
 * Mounts all middleware, routers, and error handlers.
 * Does NOT call listen() — that belongs in server.ts.
 */
const app = express();

// ----- Security middleware -----
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(generalLimiter);

// ----- Body parsing -----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ----- Routes -----
app.use(healthRouter);
app.use(authRouter);
app.use(vendorRouter);
app.use(customerRouter);
app.use(productRouter);

// ----- 404 handler -----
app.use((_req, _res, next) => {
  next(new AppError('Route not found', 404, 'ROUTE_NOT_FOUND'));
});

// ----- Centralized error handler (must be last) -----
app.use(errorHandler);

export { app };
