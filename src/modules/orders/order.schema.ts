import { z } from 'zod';

// ── Create Order ─────────────────────────────────────────────

/** Schema for a single order item in the create order request */
const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
});

/**
 * Schema for creating a new order.
 * Customer provides vendor, items, and delivery details.
 */
export const createOrderSchema = z.object({
  vendorProfileId: z.string().uuid('Invalid vendor profile ID'),
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Maximum 50 items per order'),
  deliveryAddress: z
    .string()
    .min(1, 'Delivery address is required')
    .max(500, 'Delivery address must be at most 500 characters'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
});

/** Input type inferred from the create order schema */
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ── Update Order Status ──────────────────────────────────────

/**
 * Schema for updating order status (vendor only).
 * Valid transitions: PENDING→CONFIRMED, CONFIRMED→PACKED,
 * PACKED→OUT_FOR_DELIVERY, OUT_FOR_DELIVERY→DELIVERED
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'], {
    message: 'Invalid status. Must be CONFIRMED, PACKED, OUT_FOR_DELIVERY, or DELIVERED',
  }),
});

/** Input type inferred from the update order status schema */
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// ── Record Payment ───────────────────────────────────────────

/**
 * Schema for recording a payment against an order.
 * Supports partial payments.
 */
export const recordPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['COD', 'UPI', 'WALLET'], {
    message: 'Invalid payment method. Must be COD, UPI, or WALLET',
  }),
  reference: z.string().max(200, 'Reference must be at most 200 characters').optional(),
});

/** Input type inferred from the record payment schema */
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

// ── Query / Params ───────────────────────────────────────────

/**
 * Schema for order ID path parameter.
 */
export const orderIdParamSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
});

/** Input type inferred from the order ID param schema */
export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

/**
 * Schema for listing orders query parameters.
 */
export const listOrdersQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'], {
      message: 'Invalid status filter',
    })
    .optional(),
  page: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive())
    .optional(),
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
  sortOrder: z.enum(['asc', 'desc'], { message: 'Invalid sort order' }).optional(),
});

/** Input type inferred from the list orders query schema */
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
