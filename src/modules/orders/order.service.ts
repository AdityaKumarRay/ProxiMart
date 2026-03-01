import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  RecordPaymentInput,
  ListOrdersQuery,
} from './order.schema.js';

// ── Response types ───────────────────────────────────────────

/** Shape of order item data returned to clients */
interface OrderItemResponse {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

/** Shape of payment data returned to clients */
interface PaymentResponse {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  createdAt: Date;
}

/** Shape of receipt data returned to clients */
interface ReceiptResponse {
  id: string;
  orderId: string;
  receiptNumber: string;
  totalAmount: number;
  paidAmount: number;
  issuedAt: Date;
}

/** Shape of order data returned to clients */
interface OrderResponse {
  id: string;
  orderNumber: string;
  customerProfileId: string;
  vendorProfileId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  paidAmount: number;
  deliveryAddress: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemResponse[];
  payments: PaymentResponse[];
  receipt: ReceiptResponse | null;
}

/** Shape of paginated order list response */
interface OrderListResponse {
  orders: OrderResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Valid order status transitions map */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

/** Include clause for full order with relations */
const ORDER_INCLUDE = {
  items: true,
  payments: { orderBy: { createdAt: 'desc' as const } },
  receipt: true,
};

/**
 * Generate a unique order number with prefix and timestamp.
 * Format: PM-YYYYMMDD-XXXXXX (6 random hex chars)
 */
function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `PM-${date}-${rand}`;
}

/**
 * Generate a unique receipt number.
 * Format: RCP-YYYYMMDD-XXXXXX
 */
function generateReceiptNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `RCP-${date}-${rand}`;
}

/**
 * Order service.
 * Handles order lifecycle, payments, and receipt generation.
 * Uses Prisma transactions for ACID guarantees on order creation.
 */
export class OrderService {
  /**
   * Create a new order with ACID transaction.
   * Atomically validates products, checks stock, decrements inventory,
   * and creates the order with all items.
   *
   * @throws AppError 404 if customer profile not found
   * @throws AppError 404 if vendor profile not found
   * @throws AppError 404 if any product not found
   * @throws AppError 400 if product not available or belongs to wrong vendor
   * @throws AppError 400 if insufficient stock
   */
  async createOrder(userId: string, input: CreateOrderInput): Promise<OrderResponse> {
    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!customerProfile) {
      logger.warn({ userId }, 'Customer profile not found when creating order');
      throw new AppError(
        'Customer profile not found — create a profile first',
        404,
        'PROFILE_NOT_FOUND',
      );
    }

    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { id: input.vendorProfileId },
    });

    if (!vendorProfile) {
      logger.warn({ vendorProfileId: input.vendorProfileId }, 'Vendor profile not found');
      throw new AppError('Vendor profile not found', 404, 'VENDOR_NOT_FOUND');
    }

    // Execute order creation in an ACID transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Validate all products and calculate totals
      const productIds = input.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      let totalAmount = 0;
      const orderItemsData: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
        subtotal: number;
      }[] = [];

      for (const item of input.items) {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new AppError(`Product not found: ${item.productId}`, 404, 'PRODUCT_NOT_FOUND');
        }

        if (product.vendorProfileId !== input.vendorProfileId) {
          throw new AppError(
            `Product ${product.name} does not belong to this vendor`,
            400,
            'PRODUCT_VENDOR_MISMATCH',
          );
        }

        if (!product.isAvailable) {
          throw new AppError(
            `Product ${product.name} is not available`,
            400,
            'PRODUCT_NOT_AVAILABLE',
          );
        }

        if (product.stock < item.quantity) {
          throw new AppError(
            `Insufficient stock for ${product.name}: available ${product.stock}, requested ${item.quantity}`,
            400,
            'INSUFFICIENT_STOCK',
          );
        }

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;
        orderItemsData.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          subtotal,
        });
      }

      // 2. Decrement inventory for all products
      for (const item of input.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 3. Create the order with items
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerProfileId: customerProfile.id,
          vendorProfileId: input.vendorProfileId,
          totalAmount,
          deliveryAddress: input.deliveryAddress,
          notes: input.notes ?? null,
          items: {
            create: orderItemsData,
          },
        },
        include: ORDER_INCLUDE,
      });

      return createdOrder;
    });

    logger.info(
      { userId, orderId: order.id, orderNumber: order.orderNumber },
      'Order created successfully',
    );

    return order;
  }

  /**
   * Get a single order by ID with all relations.
   * Verifies the requesting user has access (customer or vendor).
   *
   * @throws AppError 404 if order not found
   * @throws AppError 403 if user has no access to this order
   */
  async getOrder(userId: string, role: string, orderId: string): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      logger.warn({ orderId }, 'Order not found');
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Verify access: customer sees own orders, vendor sees orders placed with them
    await this.verifyOrderAccess(userId, role, order);

    return order;
  }

  /**
   * List orders for the authenticated user.
   * Customers see their orders; vendors see orders placed with them.
   */
  async listOrders(
    userId: string,
    role: string,
    query: ListOrdersQuery,
  ): Promise<OrderListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Record<string, unknown> = {};

    // Filter by role
    if (role === 'CUSTOMER') {
      const profile = await prisma.customerProfile.findUnique({ where: { userId } });
      if (!profile) {
        throw new AppError('Customer profile not found', 404, 'PROFILE_NOT_FOUND');
      }
      where['customerProfileId'] = profile.id;
    } else {
      const profile = await prisma.vendorProfile.findUnique({ where: { userId } });
      if (!profile) {
        throw new AppError('Vendor profile not found', 404, 'PROFILE_NOT_FOUND');
      }
      where['vendorProfileId'] = profile.id;
    }

    if (query.status) {
      where['status'] = query.status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
      }),
      prisma.order.count({ where }),
    ]);

    logger.info({ userId, role, total }, 'Orders listed');

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update order status (vendor only).
   * Enforces valid status transitions.
   *
   * @throws AppError 404 if order not found
   * @throws AppError 403 if vendor doesn't own this order
   * @throws AppError 400 if status transition is invalid
   */
  async updateOrderStatus(
    userId: string,
    orderId: string,
    input: UpdateOrderStatusInput,
  ): Promise<OrderResponse> {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new AppError('Vendor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.vendorProfileId !== vendorProfile.id) {
      logger.warn({ userId, orderId }, 'Vendor attempted to update another vendor order');
      throw new AppError('You can only update your own orders', 403, 'FORBIDDEN');
    }

    const validTransitions = VALID_STATUS_TRANSITIONS[order.status] ?? [];
    if (!validTransitions.includes(input.status)) {
      throw new AppError(
        `Cannot transition from ${order.status} to ${input.status}`,
        400,
        'INVALID_STATUS_TRANSITION',
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: input.status },
      include: ORDER_INCLUDE,
    });

    logger.info({ userId, orderId, from: order.status, to: input.status }, 'Order status updated');

    return updatedOrder;
  }

  /**
   * Cancel an order (customer only, before PACKED).
   * Restores inventory for all items.
   *
   * @throws AppError 404 if order not found
   * @throws AppError 403 if customer doesn't own this order
   * @throws AppError 400 if order cannot be cancelled (already packed+)
   */
  async cancelOrder(userId: string, orderId: string): Promise<OrderResponse> {
    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!customerProfile) {
      throw new AppError('Customer profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true, receipt: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.customerProfileId !== customerProfile.id) {
      logger.warn({ userId, orderId }, 'Customer attempted to cancel another customer order');
      throw new AppError('You can only cancel your own orders', 403, 'FORBIDDEN');
    }

    const validTransitions = VALID_STATUS_TRANSITIONS[order.status] ?? [];
    if (!validTransitions.includes('CANCELLED')) {
      throw new AppError(
        `Cannot cancel order in ${order.status} status`,
        400,
        'INVALID_STATUS_TRANSITION',
      );
    }

    // Restore inventory and cancel in a transaction
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Restore stock for each item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: ORDER_INCLUDE,
      });
    });

    logger.info({ userId, orderId }, 'Order cancelled — inventory restored');

    return cancelledOrder;
  }

  /**
   * Record a payment for an order.
   * Supports partial payments. Updates order paymentStatus accordingly.
   *
   * @throws AppError 404 if order not found
   * @throws AppError 403 if user has no access
   * @throws AppError 400 if order is cancelled
   * @throws AppError 400 if payment exceeds remaining balance
   */
  async recordPayment(
    userId: string,
    role: string,
    orderId: string,
    input: RecordPaymentInput,
  ): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    await this.verifyOrderAccess(userId, role, order);

    if (order.status === 'CANCELLED') {
      throw new AppError('Cannot record payment for a cancelled order', 400, 'ORDER_CANCELLED');
    }

    if (order.paymentStatus === 'PAID') {
      throw new AppError('Order is already fully paid', 400, 'ALREADY_PAID');
    }

    const remainingBalance = order.totalAmount - order.paidAmount;
    if (input.amount > remainingBalance + 0.01) {
      // +0.01 for floating point tolerance
      throw new AppError(
        `Payment amount ${input.amount} exceeds remaining balance ${remainingBalance.toFixed(2)}`,
        400,
        'PAYMENT_EXCEEDS_BALANCE',
      );
    }

    const newPaidAmount = order.paidAmount + input.amount;
    const newPaymentStatus = newPaidAmount >= order.totalAmount - 0.01 ? 'PAID' : 'PARTIAL';

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId,
          amount: input.amount,
          method: input.method,
          reference: input.reference ?? null,
        },
      });

      return tx.order.update({
        where: { id: orderId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus,
        },
        include: ORDER_INCLUDE,
      });
    });

    logger.info({ userId, orderId, amount: input.amount, newPaymentStatus }, 'Payment recorded');

    return updatedOrder;
  }

  /**
   * Generate a receipt for a delivered order (vendor only).
   *
   * @throws AppError 404 if order not found
   * @throws AppError 403 if vendor doesn't own this order
   * @throws AppError 400 if order is not delivered
   * @throws AppError 409 if receipt already exists
   */
  async generateReceipt(userId: string, orderId: string): Promise<ReceiptResponse> {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new AppError('Vendor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { receipt: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.vendorProfileId !== vendorProfile.id) {
      throw new AppError('You can only generate receipts for your own orders', 403, 'FORBIDDEN');
    }

    if (order.status !== 'DELIVERED') {
      throw new AppError(
        'Receipt can only be generated for delivered orders',
        400,
        'ORDER_NOT_DELIVERED',
      );
    }

    if (order.receipt) {
      throw new AppError('Receipt already exists for this order', 409, 'RECEIPT_EXISTS');
    }

    const receipt = await prisma.receipt.create({
      data: {
        orderId,
        receiptNumber: generateReceiptNumber(),
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
      },
    });

    logger.info(
      { userId, orderId, receiptId: receipt.id, receiptNumber: receipt.receiptNumber },
      'Receipt generated',
    );

    return receipt;
  }

  /**
   * Get receipt for an order.
   *
   * @throws AppError 404 if order not found
   * @throws AppError 403 if user has no access
   * @throws AppError 404 if receipt not found
   */
  async getReceipt(userId: string, role: string, orderId: string): Promise<ReceiptResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { ...ORDER_INCLUDE, receipt: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    await this.verifyOrderAccess(userId, role, order);

    if (!order.receipt) {
      throw new AppError('Receipt not found for this order', 404, 'RECEIPT_NOT_FOUND');
    }

    return order.receipt;
  }

  /**
   * Verify the requesting user has access to the given order.
   * Customer must own the order; vendor must be the order's vendor.
   */
  private async verifyOrderAccess(
    userId: string,
    role: string,
    order: { customerProfileId: string; vendorProfileId: string },
  ): Promise<void> {
    if (role === 'CUSTOMER') {
      const profile = await prisma.customerProfile.findUnique({ where: { userId } });
      if (!profile || profile.id !== order.customerProfileId) {
        throw new AppError('You do not have access to this order', 403, 'FORBIDDEN');
      }
    } else if (role === 'VENDOR') {
      const profile = await prisma.vendorProfile.findUnique({ where: { userId } });
      if (!profile || profile.id !== order.vendorProfileId) {
        throw new AppError('You do not have access to this order', 403, 'FORBIDDEN');
      }
    }
  }
}

/** Singleton order service instance */
export const orderService = new OrderService();
