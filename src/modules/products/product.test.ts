import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app.js';
import { prisma } from '../../prisma/client.js';
import { env } from '../../config/env.js';

// Mock Prisma client
jest.mock('../../prisma/client.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    vendorProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customerProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

const VENDOR_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const CUSTOMER_USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const PRODUCT_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const VENDOR_PROFILE_ID = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e';
const CATEGORY_ID = 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f';

/** Generate a valid vendor access token */
function vendorToken(userId = VENDOR_USER_ID): string {
  return jwt.sign({ userId, email: 'vendor@test.com', role: 'VENDOR' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

/** Generate a valid customer access token */
function customerToken(userId = CUSTOMER_USER_ID): string {
  return jwt.sign({ userId, email: 'customer@test.com', role: 'CUSTOMER' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

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

const MOCK_CATEGORY = {
  id: CATEGORY_ID,
  name: 'Groceries',
  description: 'Daily grocery items',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const MOCK_PRODUCT = {
  id: PRODUCT_ID,
  vendorProfileId: VENDOR_PROFILE_ID,
  categoryId: CATEGORY_ID,
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
  category: { id: CATEGORY_ID, name: 'Groceries' },
};

const VALID_CREATE_PAYLOAD = {
  name: 'Basmati Rice 5kg',
  description: 'Premium aged basmati rice',
  price: 450,
  unit: 'bag',
  categoryId: CATEGORY_ID,
  stock: 25,
  lowStockThreshold: 10,
};

afterEach(() => {
  jest.resetAllMocks();
});

// ──────────────────────────────────────────────────
// POST /products — Create product
// ──────────────────────────────────────────────────

describe('POST /products', () => {
  it('should create a product (201)', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.category.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_CATEGORY);
    (mockedPrisma.product.create as jest.Mock).mockResolvedValueOnce(MOCK_PRODUCT);

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Basmati Rice 5kg');
    expect(res.body.message).toBe('Product created');
  });

  it('should create a product without categoryId (201)', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    const productNoCat = { ...MOCK_PRODUCT, categoryId: null, category: null };
    (mockedPrisma.product.create as jest.Mock).mockResolvedValueOnce(productNoCat);

    const { categoryId: _unused, ...payloadNoCat } = VALID_CREATE_PAYLOAD;
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(payloadNoCat);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).post('/products').send(VALID_CREATE_PAYLOAD);
    expect(res.status).toBe(401);
  });

  it('should return 403 for customer role', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(403);
  });

  it('should return 400 for missing name', async () => {
    const { name: _unused, ...payload } = VALID_CREATE_PAYLOAD;
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for negative price', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ ...VALID_CREATE_PAYLOAD, price: -10 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid categoryId format', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ ...VALID_CREATE_PAYLOAD, categoryId: 'not-a-uuid' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 if vendor has no profile', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('should return 404 if category does not exist', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.category.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
  });
});

// ──────────────────────────────────────────────────
// GET /products — List products (public)
// ──────────────────────────────────────────────────

describe('GET /products', () => {
  it('should list products with default pagination (200)', async () => {
    (mockedPrisma.product.findMany as jest.Mock).mockResolvedValueOnce([MOCK_PRODUCT]);
    (mockedPrisma.product.count as jest.Mock).mockResolvedValueOnce(1);

    const res = await request(app).get('/products');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.total).toBe(1);
  });

  it('should filter by vendorProfileId', async () => {
    (mockedPrisma.product.findMany as jest.Mock).mockResolvedValueOnce([MOCK_PRODUCT]);
    (mockedPrisma.product.count as jest.Mock).mockResolvedValueOnce(1);

    const res = await request(app).get(`/products?vendorProfileId=${VENDOR_PROFILE_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should filter by search term', async () => {
    (mockedPrisma.product.findMany as jest.Mock).mockResolvedValueOnce([MOCK_PRODUCT]);
    (mockedPrisma.product.count as jest.Mock).mockResolvedValueOnce(1);

    const res = await request(app).get('/products?search=rice');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should filter by price range', async () => {
    (mockedPrisma.product.findMany as jest.Mock).mockResolvedValueOnce([MOCK_PRODUCT]);
    (mockedPrisma.product.count as jest.Mock).mockResolvedValueOnce(1);

    const res = await request(app).get('/products?minPrice=100&maxPrice=500');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should paginate with page and limit', async () => {
    (mockedPrisma.product.findMany as jest.Mock).mockResolvedValueOnce([]);
    (mockedPrisma.product.count as jest.Mock).mockResolvedValueOnce(50);

    const res = await request(app).get('/products?page=3&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.page).toBe(3);
    expect(res.body.data.pagination.limit).toBe(10);
    expect(res.body.data.pagination.totalPages).toBe(5);
  });

  it('should return 400 for invalid sort field', async () => {
    const res = await request(app).get('/products?sortBy=invalid');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return empty list when no products match', async () => {
    (mockedPrisma.product.findMany as jest.Mock).mockResolvedValueOnce([]);
    (mockedPrisma.product.count as jest.Mock).mockResolvedValueOnce(0);

    const res = await request(app).get('/products?search=nonexistent');

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });
});

// ──────────────────────────────────────────────────
// GET /products/:productId — Get single product (public)
// ──────────────────────────────────────────────────

describe('GET /products/:productId', () => {
  it('should return a product by ID (200)', async () => {
    (mockedPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_PRODUCT);

    const res = await request(app).get(`/products/${PRODUCT_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Basmati Rice 5kg');
    expect(res.body.data.category.name).toBe('Groceries');
  });

  it('should return 404 if product not found', async () => {
    (mockedPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app).get(`/products/${PRODUCT_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('should return 400 for invalid UUID format', async () => {
    const res = await request(app).get('/products/not-a-uuid');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ──────────────────────────────────────────────────
// PATCH /products/:productId — Update product
// ──────────────────────────────────────────────────

describe('PATCH /products/:productId', () => {
  it('should update a product (200)', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_PRODUCT);
    const updated = { ...MOCK_PRODUCT, price: 500 };
    (mockedPrisma.product.update as jest.Mock).mockResolvedValueOnce(updated);

    const res = await request(app)
      .patch(`/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ price: 500 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(500);
    expect(res.body.message).toBe('Product updated');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).patch(`/products/${PRODUCT_ID}`).send({ price: 500 });

    expect(res.status).toBe(401);
  });

  it('should return 403 for customer role', async () => {
    const res = await request(app)
      .patch(`/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ price: 500 });

    expect(res.status).toBe(403);
  });

  it('should return 404 if vendor has no profile', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .patch(`/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ price: 500 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('should return 404 if product not found', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .patch(`/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ price: 500 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('should return 403 if product belongs to another vendor', async () => {
    const otherProfile = { ...MOCK_VENDOR_PROFILE, id: 'other-profile-id' };
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(otherProfile);
    (mockedPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_PRODUCT);

    const res = await request(app)
      .patch(`/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ price: 500 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 400 for invalid price', async () => {
    const res = await request(app)
      .patch(`/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ price: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid productId format', async () => {
    const res = await request(app)
      .patch('/products/not-valid')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ price: 500 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ──────────────────────────────────────────────────
// DELETE /products/:productId — Delete product
// ──────────────────────────────────────────────────

describe('DELETE /products/:productId', () => {
  it('should delete a product (200)', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_PRODUCT);
    (mockedPrisma.product.delete as jest.Mock).mockResolvedValueOnce(MOCK_PRODUCT);

    const res = await request(app)
      .delete(`/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
    expect(res.body.message).toBe('Product deleted');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).delete(`/products/${PRODUCT_ID}`);
    expect(res.status).toBe(401);
  });

  it('should return 403 for customer role', async () => {
    const res = await request(app)
      .delete(`/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 if vendor has no profile', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .delete(`/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('should return 404 if product not found', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .delete(`/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('should return 403 if product belongs to another vendor', async () => {
    const otherProfile = { ...MOCK_VENDOR_PROFILE, id: 'other-profile-id' };
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(otherProfile);
    (mockedPrisma.product.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_PRODUCT);

    const res = await request(app)
      .delete(`/products/${PRODUCT_ID}`)
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 400 for invalid productId', async () => {
    const res = await request(app)
      .delete('/products/not-a-uuid')
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ──────────────────────────────────────────────────
// GET /products/low-stock — Low stock alerts
// ──────────────────────────────────────────────────

describe('GET /products/low-stock', () => {
  it('should return low-stock products (200)', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    const lowStockItems = [
      { id: PRODUCT_ID, name: 'Basmati Rice 5kg', stock: 3, lowStockThreshold: 10 },
    ];
    (mockedPrisma.$queryRaw as jest.Mock).mockResolvedValueOnce(lowStockItems);

    const res = await request(app)
      .get('/products/low-stock')
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].stock).toBe(3);
    expect(res.body.message).toBe('Low-stock products retrieved');
  });

  it('should return empty array when no low-stock products', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(MOCK_VENDOR_PROFILE);
    (mockedPrisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/products/low-stock')
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/products/low-stock');
    expect(res.status).toBe(401);
  });

  it('should return 403 for customer role', async () => {
    const res = await request(app)
      .get('/products/low-stock')
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 if vendor has no profile', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/products/low-stock')
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });
});
