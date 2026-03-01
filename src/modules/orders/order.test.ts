import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app.js';
import { prisma } from '../../prisma/client.js';
import { env } from '../../config/env.js';

// Mock Prisma client
jest.mock('../../prisma/client.js', () => {
  const mockPrisma = {
    user: { findUnique: jest.fn() },
    vendorProfile: { findUnique: jest.fn() },
    customerProfile: { findUnique: jest.fn() },
    category: { findUnique: jest.fn() },
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    payment: { create: jest.fn() },
    receipt: { create: jest.fn() },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  return { prisma: mockPrisma };
});

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

// ── Constants ──────────────────────────────────────

const VENDOR_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const CUSTOMER_USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const VENDOR_PROFILE_ID = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e';
const CUSTOMER_PROFILE_ID = 'd1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a';
const PRODUCT_ID_1 = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const PRODUCT_ID_2 = 'a2b3c4d5-e6f7-4b8c-9d0e-1f2a3b4c5d6e';
const ORDER_ID = 'f1e2d3c4-b5a6-4978-8d9e-0f1a2b3c4d5e';
const PAYMENT_ID = 'e1d2c3b4-a5f6-4a7b-8c9d-0e1f2a3b4c5d';
const RECEIPT_ID = 'c1b2a3f4-d5e6-4c7b-8a9d-0e1f2a3b4c5d';

function vendorToken(userId = VENDOR_USER_ID): string {
  return jwt.sign({ userId, email: 'vendor@test.com', role: 'VENDOR' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

function customerToken(userId = CUSTOMER_USER_ID): string {
  return jwt.sign({ userId, email: 'customer@test.com', role: 'CUSTOMER' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

// ── Mock data ────────────────────────────────────

const MOCK_CUSTOMER_PROFILE = {
  id: CUSTOMER_PROFILE_ID,
  userId: CUSTOMER_USER_ID,
  fullName: 'Aditya Kumar',
  phone: '9876543210',
  address: '456 Market Road',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001',
  latitude: 28.6139,
  longitude: 77.209,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const MOCK_VENDOR_PROFILE = {
  id: VENDOR_PROFILE_ID,
  userId: VENDOR_USER_ID,
  shopName: 'Ramesh Kirana',
  description: 'Fresh groceries daily',
  address: '123 Main Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  gstNumber: null,
  latitude: 19.076,
  longitude: 72.8777,
  deliveryRadius: 5.0,
  isOpen: false,
  openingTime: '08:00',
  closingTime: '22:00',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const MOCK_PRODUCT_1 = {
  id: PRODUCT_ID_1,
  vendorProfileId: VENDOR_PROFILE_ID,
  categoryId: null,
  name: 'Basmati Rice 5kg',
  description: 'Premium aged basmati rice',
  price: 450,
  unit: 'bag',
  imageUrl: null,
  stock: 25,
  lowStockThreshold: 10,
  isAvailable: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const MOCK_PRODUCT_2 = {
  id: PRODUCT_ID_2,
  vendorProfileId: VENDOR_PROFILE_ID,
  categoryId: null,
  name: 'Dal 1kg',
  description: 'Premium toor dal',
  price: 120,
  unit: 'bag',
  imageUrl: null,
  stock: 50,
  lowStockThreshold: 10,
  isAvailable: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const MOCK_ORDER_ITEMS = [
  {
    id: 'item-1-uuid-0000-0000-000000000001',
    orderId: ORDER_ID,
    productId: PRODUCT_ID_1,
    name: 'Basmati Rice 5kg',
    price: 450,
    quantity: 2,
    subtotal: 900,
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'item-2-uuid-0000-0000-000000000002',
    orderId: ORDER_ID,
    productId: PRODUCT_ID_2,
    name: 'Dal 1kg',
    price: 120,
    quantity: 3,
    subtotal: 360,
    createdAt: new Date('2026-01-01'),
  },
];

const MOCK_ORDER = {
  id: ORDER_ID,
  orderNumber: 'PM-20260101-ABC123',
  customerProfileId: CUSTOMER_PROFILE_ID,
  vendorProfileId: VENDOR_PROFILE_ID,
  status: 'PENDING',
  paymentStatus: 'PENDING',
  totalAmount: 1260,
  paidAmount: 0,
  deliveryAddress: '456 Market Road, Delhi',
  notes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  items: MOCK_ORDER_ITEMS,
  payments: [],
  receipt: null,
};

const MOCK_PAYMENT = {
  id: PAYMENT_ID,
  orderId: ORDER_ID,
  amount: 600,
  method: 'UPI',
  reference: 'upi-txn-123',
  createdAt: new Date('2026-01-01'),
};

const MOCK_RECEIPT = {
  id: RECEIPT_ID,
  orderId: ORDER_ID,
  receiptNumber: 'RCP-20260101-ABC123',
  totalAmount: 1260,
  paidAmount: 1260,
  issuedAt: new Date('2026-01-01'),
};

const VALID_CREATE_ORDER_PAYLOAD = {
  vendorProfileId: VENDOR_PROFILE_ID,
  items: [
    { productId: PRODUCT_ID_1, quantity: 2 },
    { productId: PRODUCT_ID_2, quantity: 3 },
  ],
  deliveryAddress: '456 Market Road, Delhi',
};

/**
 * Helper: set up $transaction to just invoke the callback with mockedPrisma.
 */
function mockTransactionPassthrough(): void {
  (mockedPrisma.$transaction as jest.Mock).mockImplementationOnce(
    async (callback: (tx: typeof mockedPrisma) => Promise<unknown>) => {
      return callback(mockedPrisma);
    },
  );
}

afterEach(() => {
  jest.resetAllMocks();
});

// ══════════════════════════════════════════════════
// POST /orders — Create order (customer only)
// ══════════════════════════════════════════════════

describe('POST /orders', () => {
  it('should create an order with ACID transaction (201)', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);

    // $transaction callback
    mockTransactionPassthrough();
    (mockedPrisma.product.findMany as jest.Mock).mockResolvedValueOnce([
      MOCK_PRODUCT_1,
      MOCK_PRODUCT_2,
    ]);
    // product.update for stock decrement (2 calls)
    (mockedPrisma.product.update as jest.Mock)
      .mockResolvedValueOnce({ ...MOCK_PRODUCT_1, stock: 23 })
      .mockResolvedValueOnce({ ...MOCK_PRODUCT_2, stock: 47 });
    (mockedPrisma.order.create as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(VALID_CREATE_ORDER_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderNumber).toBe('PM-20260101-ABC123');
    expect(res.body.data.totalAmount).toBe(1260);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.message).toBe('Order created');
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).post('/orders').send(VALID_CREATE_ORDER_PAYLOAD);
    expect(res.status).toBe(401);
  });

  it('should return 403 for vendor role', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(VALID_CREATE_ORDER_PAYLOAD);
    expect(res.status).toBe(403);
  });

  it('should return 400 for missing vendorProfileId', async () => {
    const { vendorProfileId: _v, ...payload } = VALID_CREATE_ORDER_PAYLOAD;
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for empty items array', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ ...VALID_CREATE_ORDER_PAYLOAD, items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for zero quantity', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({
        ...VALID_CREATE_ORDER_PAYLOAD,
        items: [{ productId: PRODUCT_ID_1, quantity: 0 }],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 if customer profile not found', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(VALID_CREATE_ORDER_PAYLOAD);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('should return 404 if vendor profile not found', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(VALID_CREATE_ORDER_PAYLOAD);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('VENDOR_NOT_FOUND');
  });

  it('should return 404 if a product is not found in transaction', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    mockTransactionPassthrough();
    // Only one product found (PRODUCT_ID_2 missing)
    (mockedPrisma.product.findMany as jest.Mock).mockResolvedValueOnce([MOCK_PRODUCT_1]);

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(VALID_CREATE_ORDER_PAYLOAD);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('should return 400 if product belongs to wrong vendor', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    mockTransactionPassthrough();
    const wrongVendorProduct = {
      ...MOCK_PRODUCT_1,
      vendorProfileId: 'x1y2z3w4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
    };
    (mockedPrisma.product.findMany as jest.Mock).mockResolvedValueOnce([
      wrongVendorProduct,
      MOCK_PRODUCT_2,
    ]);

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(VALID_CREATE_ORDER_PAYLOAD);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PRODUCT_VENDOR_MISMATCH');
  });

  it('should return 400 if product is not available', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    mockTransactionPassthrough();
    const unavailable = { ...MOCK_PRODUCT_1, isAvailable: false };
    (mockedPrisma.product.findMany as jest.Mock).mockResolvedValueOnce([
      unavailable,
      MOCK_PRODUCT_2,
    ]);

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(VALID_CREATE_ORDER_PAYLOAD);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PRODUCT_NOT_AVAILABLE');
  });

  it('should return 400 if insufficient stock', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    mockTransactionPassthrough();
    const lowStock = { ...MOCK_PRODUCT_1, stock: 1 }; // need 2, only 1 available
    (mockedPrisma.product.findMany as jest.Mock).mockResolvedValueOnce([lowStock, MOCK_PRODUCT_2]);

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(VALID_CREATE_ORDER_PAYLOAD);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });
});

// ══════════════════════════════════════════════════
// GET /orders — List orders (authenticated)
// ══════════════════════════════════════════════════

describe('GET /orders', () => {
  it('should list customer orders with pagination (200)', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.order.findMany as jest.Mock).mockResolvedValueOnce([MOCK_ORDER]);
    (mockedPrisma.order.count as jest.Mock).mockResolvedValueOnce(1);

    const res = await request(app).get('/orders').set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orders).toHaveLength(1);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.message).toBe('Orders retrieved');
  });

  it('should list vendor orders (200)', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.order.findMany as jest.Mock).mockResolvedValueOnce([MOCK_ORDER]);
    (mockedPrisma.order.count as jest.Mock).mockResolvedValueOnce(1);

    const res = await request(app).get('/orders').set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders).toHaveLength(1);
  });

  it('should filter by status', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.order.findMany as jest.Mock).mockResolvedValueOnce([]);
    (mockedPrisma.order.count as jest.Mock).mockResolvedValueOnce(0);

    const res = await request(app)
      .get('/orders?status=DELIVERED')
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders).toHaveLength(0);
  });

  it('should paginate with page and limit', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.order.findMany as jest.Mock).mockResolvedValueOnce([]);
    (mockedPrisma.order.count as jest.Mock).mockResolvedValueOnce(50);

    const res = await request(app)
      .get('/orders?page=3&limit=10')
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.page).toBe(3);
    expect(res.body.data.pagination.limit).toBe(10);
    expect(res.body.data.pagination.totalPages).toBe(5);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/orders');
    expect(res.status).toBe(401);
  });

  it('should return 404 if customer profile not found', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app).get('/orders').set('Authorization', `Bearer ${customerToken()}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });
});

// ══════════════════════════════════════════════════
// GET /orders/:orderId — Get single order
// ══════════════════════════════════════════════════

describe('GET /orders/:orderId', () => {
  it('should return an order for customer (200)', async () => {
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );

    const res = await request(app)
      .get(`/orders/${ORDER_ID}`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(ORDER_ID);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.message).toBe('Order retrieved');
  });

  it('should return an order for vendor (200)', async () => {
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);

    const res = await request(app)
      .get(`/orders/${ORDER_ID}`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(ORDER_ID);
  });

  it('should return 404 if order not found', async () => {
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .get(`/orders/${ORDER_ID}`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  it('should return 403 if customer does not own the order', async () => {
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);
    // Return a different customer profile
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      ...MOCK_CUSTOMER_PROFILE,
      id: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
    });

    const res = await request(app)
      .get(`/orders/${ORDER_ID}`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 400 for invalid orderId format', async () => {
    const res = await request(app)
      .get('/orders/not-a-uuid')
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get(`/orders/${ORDER_ID}`);
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════
// PATCH /orders/:orderId/status — Update status (vendor only)
// ══════════════════════════════════════════════════

describe('PATCH /orders/:orderId/status', () => {
  it('should update status from PENDING to CONFIRMED (200)', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);
    const updatedOrder = { ...MOCK_ORDER, status: 'CONFIRMED' };
    (mockedPrisma.order.update as jest.Mock).mockResolvedValueOnce(updatedOrder);

    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/status`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.message).toBe('Order status updated');
  });

  it('should update status CONFIRMED → PACKED (200)', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    const confirmed = { ...MOCK_ORDER, status: 'CONFIRMED' };
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(confirmed);
    (mockedPrisma.order.update as jest.Mock).mockResolvedValueOnce({
      ...confirmed,
      status: 'PACKED',
    });

    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/status`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ status: 'PACKED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PACKED');
  });

  it('should return 400 for invalid status transition PENDING → DELIVERED', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);

    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/status`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ status: 'DELIVERED' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('should return 403 for customer role', async () => {
    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/status`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(403);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/status`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(401);
  });

  it('should return 404 if vendor profile not found', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/status`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('should return 404 if order not found', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/status`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  it('should return 403 if vendor does not own the order', async () => {
    const otherVendor = {
      ...MOCK_VENDOR_PROFILE,
      id: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
    };
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(otherVendor);
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);

    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/status`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 400 for invalid status value', async () => {
    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/status`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ status: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ══════════════════════════════════════════════════
// PATCH /orders/:orderId/cancel — Cancel order (customer only)
// ══════════════════════════════════════════════════

describe('PATCH /orders/:orderId/cancel', () => {
  it('should cancel a PENDING order and restore stock (200)', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);
    mockTransactionPassthrough();
    // product.update for stock restore (2 items)
    (mockedPrisma.product.update as jest.Mock)
      .mockResolvedValueOnce({ ...MOCK_PRODUCT_1, stock: 27 })
      .mockResolvedValueOnce({ ...MOCK_PRODUCT_2, stock: 53 });
    const cancelledOrder = { ...MOCK_ORDER, status: 'CANCELLED' };
    (mockedPrisma.order.update as jest.Mock).mockResolvedValueOnce(cancelledOrder);

    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/cancel`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CANCELLED');
    expect(res.body.message).toBe('Order cancelled');
  });

  it('should cancel a CONFIRMED order (200)', async () => {
    const confirmed = { ...MOCK_ORDER, status: 'CONFIRMED' };
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(confirmed);
    mockTransactionPassthrough();
    (mockedPrisma.product.update as jest.Mock)
      .mockResolvedValueOnce({ ...MOCK_PRODUCT_1, stock: 27 })
      .mockResolvedValueOnce({ ...MOCK_PRODUCT_2, stock: 53 });
    (mockedPrisma.order.update as jest.Mock).mockResolvedValueOnce({
      ...confirmed,
      status: 'CANCELLED',
    });

    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/cancel`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('should return 400 if order is OUT_FOR_DELIVERY', async () => {
    const outForDelivery = { ...MOCK_ORDER, status: 'OUT_FOR_DELIVERY' };
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(outForDelivery);

    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/cancel`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('should return 400 if order is already DELIVERED', async () => {
    const delivered = { ...MOCK_ORDER, status: 'DELIVERED' };
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(delivered);

    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/cancel`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('should return 403 for vendor role', async () => {
    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/cancel`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(403);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).patch(`/orders/${ORDER_ID}/cancel`);
    expect(res.status).toBe(401);
  });

  it('should return 403 if customer does not own the order', async () => {
    const otherCustomer = {
      ...MOCK_CUSTOMER_PROFILE,
      id: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
    };
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(otherCustomer);
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);

    const res = await request(app)
      .patch(`/orders/${ORDER_ID}/cancel`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

// ══════════════════════════════════════════════════
// POST /orders/:orderId/payments — Record payment
// ══════════════════════════════════════════════════

describe('POST /orders/:orderId/payments', () => {
  it('should record a partial payment (200)', async () => {
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    mockTransactionPassthrough();
    (mockedPrisma.payment.create as jest.Mock).mockResolvedValueOnce(MOCK_PAYMENT);
    const updatedOrder = {
      ...MOCK_ORDER,
      paidAmount: 600,
      paymentStatus: 'PARTIAL',
      payments: [MOCK_PAYMENT],
    };
    (mockedPrisma.order.update as jest.Mock).mockResolvedValueOnce(updatedOrder);

    const res = await request(app)
      .post(`/orders/${ORDER_ID}/payments`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ amount: 600, method: 'UPI', reference: 'upi-txn-123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paidAmount).toBe(600);
    expect(res.body.data.paymentStatus).toBe('PARTIAL');
    expect(res.body.message).toBe('Payment recorded');
  });

  it('should record a full payment (200)', async () => {
    const partialOrder = { ...MOCK_ORDER, paidAmount: 660, paymentStatus: 'PARTIAL' };
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(partialOrder);
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );
    mockTransactionPassthrough();
    const fullPayment = { ...MOCK_PAYMENT, amount: 600 };
    (mockedPrisma.payment.create as jest.Mock).mockResolvedValueOnce(fullPayment);
    const fullyPaid = {
      ...partialOrder,
      paidAmount: 1260,
      paymentStatus: 'PAID',
      payments: [MOCK_PAYMENT, fullPayment],
    };
    (mockedPrisma.order.update as jest.Mock).mockResolvedValueOnce(fullyPaid);

    const res = await request(app)
      .post(`/orders/${ORDER_ID}/payments`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ amount: 600, method: 'COD' });

    expect(res.status).toBe(200);
    expect(res.body.data.paymentStatus).toBe('PAID');
    expect(res.body.data.paidAmount).toBe(1260);
  });

  it('should return 400 if order is cancelled', async () => {
    const cancelled = { ...MOCK_ORDER, status: 'CANCELLED' };
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(cancelled);
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );

    const res = await request(app)
      .post(`/orders/${ORDER_ID}/payments`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ amount: 600, method: 'UPI' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ORDER_CANCELLED');
  });

  it('should return 400 if order is already fully paid', async () => {
    const paid = { ...MOCK_ORDER, paidAmount: 1260, paymentStatus: 'PAID' };
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(paid);
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );

    const res = await request(app)
      .post(`/orders/${ORDER_ID}/payments`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ amount: 100, method: 'UPI' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ALREADY_PAID');
  });

  it('should return 400 if payment exceeds remaining balance', async () => {
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );

    const res = await request(app)
      .post(`/orders/${ORDER_ID}/payments`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ amount: 9999, method: 'COD' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PAYMENT_EXCEEDS_BALANCE');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .post(`/orders/${ORDER_ID}/payments`)
      .send({ amount: 600, method: 'UPI' });

    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid payment method', async () => {
    const res = await request(app)
      .post(`/orders/${ORDER_ID}/payments`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ amount: 600, method: 'BITCOIN' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for zero amount', async () => {
    const res = await request(app)
      .post(`/orders/${ORDER_ID}/payments`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ amount: 0, method: 'UPI' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 if order not found', async () => {
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .post(`/orders/${ORDER_ID}/payments`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ amount: 600, method: 'UPI' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });
});

// ══════════════════════════════════════════════════
// POST /orders/:orderId/receipt — Generate receipt (vendor only)
// ══════════════════════════════════════════════════

describe('POST /orders/:orderId/receipt', () => {
  it('should generate a receipt for a delivered order (201)', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    const delivered = { ...MOCK_ORDER, status: 'DELIVERED', receipt: null };
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(delivered);
    (mockedPrisma.receipt.create as jest.Mock).mockResolvedValueOnce(MOCK_RECEIPT);

    const res = await request(app)
      .post(`/orders/${ORDER_ID}/receipt`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.receiptNumber).toMatch(/^RCP-/);
    expect(res.body.data.totalAmount).toBe(1260);
    expect(res.body.message).toBe('Receipt generated');
  });

  it('should return 400 if order is not delivered', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    // Order is PENDING, not DELIVERED
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce({
      ...MOCK_ORDER,
      receipt: null,
    });

    const res = await request(app)
      .post(`/orders/${ORDER_ID}/receipt`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ORDER_NOT_DELIVERED');
  });

  it('should return 409 if receipt already exists', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    const withReceipt = { ...MOCK_ORDER, status: 'DELIVERED', receipt: MOCK_RECEIPT };
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(withReceipt);

    const res = await request(app)
      .post(`/orders/${ORDER_ID}/receipt`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('RECEIPT_EXISTS');
  });

  it('should return 403 for customer role', async () => {
    const res = await request(app)
      .post(`/orders/${ORDER_ID}/receipt`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(403);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).post(`/orders/${ORDER_ID}/receipt`);
    expect(res.status).toBe(401);
  });

  it('should return 403 if vendor does not own order', async () => {
    const otherVendor = {
      ...MOCK_VENDOR_PROFILE,
      id: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
    };
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(otherVendor);
    const delivered = { ...MOCK_ORDER, status: 'DELIVERED', receipt: null };
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(delivered);

    const res = await request(app)
      .post(`/orders/${ORDER_ID}/receipt`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 404 if order not found', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .post(`/orders/${ORDER_ID}/receipt`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });
});

// ══════════════════════════════════════════════════
// GET /orders/:orderId/receipt — Get receipt
// ══════════════════════════════════════════════════

describe('GET /orders/:orderId/receipt', () => {
  it('should return receipt for customer (200)', async () => {
    const orderWithReceipt = { ...MOCK_ORDER, receipt: MOCK_RECEIPT };
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(orderWithReceipt);
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );

    const res = await request(app)
      .get(`/orders/${ORDER_ID}/receipt`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.receiptNumber).toBe('RCP-20260101-ABC123');
    expect(res.body.message).toBe('Receipt retrieved');
  });

  it('should return receipt for vendor (200)', async () => {
    const orderWithReceipt = { ...MOCK_ORDER, receipt: MOCK_RECEIPT };
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(orderWithReceipt);
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);

    const res = await request(app)
      .get(`/orders/${ORDER_ID}/receipt`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.receiptNumber).toBe('RCP-20260101-ABC123');
  });

  it('should return 404 if order not found', async () => {
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .get(`/orders/${ORDER_ID}/receipt`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  it('should return 404 if receipt not generated yet', async () => {
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_ORDER);
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce(
      MOCK_CUSTOMER_PROFILE,
    );

    const res = await request(app)
      .get(`/orders/${ORDER_ID}/receipt`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RECEIPT_NOT_FOUND');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get(`/orders/${ORDER_ID}/receipt`);
    expect(res.status).toBe(401);
  });

  it('should return 403 if customer does not own order', async () => {
    const orderWithReceipt = { ...MOCK_ORDER, receipt: MOCK_RECEIPT };
    (mockedPrisma.order.findUnique as jest.Mock).mockResolvedValueOnce(orderWithReceipt);
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      ...MOCK_CUSTOMER_PROFILE,
      id: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
    });

    const res = await request(app)
      .get(`/orders/${ORDER_ID}/receipt`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 400 for invalid orderId format', async () => {
    const res = await request(app)
      .get('/orders/bad-id/receipt')
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
