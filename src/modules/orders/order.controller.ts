import type { Request, Response } from 'express';
import { orderService } from './order.service.js';
import { sendSuccess } from '../../utils/response.js';
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  RecordPaymentInput,
  OrderIdParam,
  ListOrdersQuery,
} from './order.schema.js';

/**
 * Order controller.
 * Handles HTTP request/response for order endpoints.
 */
export class OrderController {
  /**
   * Create a new order (customer only).
   * @route POST /orders
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const input = req.body as CreateOrderInput;
    const order = await orderService.createOrder(userId, input);
    sendSuccess(res, order, 'Order created', 201);
  }

  /**
   * Get a single order by ID (authenticated, access-checked).
   * @route GET /orders/:orderId
   */
  async getOrder(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { orderId } = req.params as unknown as OrderIdParam;
    const order = await orderService.getOrder(userId, role, orderId);
    sendSuccess(res, order, 'Order retrieved');
  }

  /**
   * List orders for the authenticated user.
   * @route GET /orders
   */
  async listOrders(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const query = req.query as unknown as ListOrdersQuery;
    const result = await orderService.listOrders(userId, role, query);
    sendSuccess(res, result, 'Orders retrieved');
  }

  /**
   * Update order status (vendor only).
   * @route PATCH /orders/:orderId/status
   */
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { orderId } = req.params as unknown as OrderIdParam;
    const input = req.body as UpdateOrderStatusInput;
    const order = await orderService.updateOrderStatus(userId, orderId, input);
    sendSuccess(res, order, 'Order status updated');
  }

  /**
   * Cancel an order (customer only).
   * @route PATCH /orders/:orderId/cancel
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { orderId } = req.params as unknown as OrderIdParam;
    const order = await orderService.cancelOrder(userId, orderId);
    sendSuccess(res, order, 'Order cancelled');
  }

  /**
   * Record a payment for an order.
   * @route POST /orders/:orderId/payments
   */
  async recordPayment(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { orderId } = req.params as unknown as OrderIdParam;
    const input = req.body as RecordPaymentInput;
    const order = await orderService.recordPayment(userId, role, orderId, input);
    sendSuccess(res, order, 'Payment recorded');
  }

  /**
   * Generate receipt for a delivered order (vendor only).
   * @route POST /orders/:orderId/receipt
   */
  async generateReceipt(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { orderId } = req.params as unknown as OrderIdParam;
    const receipt = await orderService.generateReceipt(userId, orderId);
    sendSuccess(res, receipt, 'Receipt generated', 201);
  }

  /**
   * Get receipt for an order (authenticated, access-checked).
   * @route GET /orders/:orderId/receipt
   */
  async getReceipt(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { orderId } = req.params as unknown as OrderIdParam;
    const receipt = await orderService.getReceipt(userId, role, orderId);
    sendSuccess(res, receipt, 'Receipt retrieved');
  }
}

/** Singleton order controller instance */
export const orderController = new OrderController();
