import { Router } from 'express';
import { getHealth } from './health.controller.js';

/**
 * Health check router.
 * Provides a simple endpoint for monitoring and load balancer health probes.
 */
const healthRouter = Router();

healthRouter.get('/health', getHealth);

export { healthRouter };
