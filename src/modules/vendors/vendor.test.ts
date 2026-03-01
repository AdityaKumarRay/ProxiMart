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
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

/** Generate a valid vendor access token */
function vendorToken(userId = '550e8400-e29b-41d4-a716-446655440000'): string {
  return jwt.sign({ userId, email: 'vendor@test.com', role: 'VENDOR' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

/** Generate a valid customer access token */
function customerToken(userId = '660e8400-e29b-41d4-a716-446655440001'): string {
  return jwt.sign({ userId, email: 'customer@test.com', role: 'CUSTOMER' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

const VENDOR_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const MOCK_VENDOR_PROFILE = {
  id: 'profile-uuid-1',
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

const VALID_CREATE_PAYLOAD = {
  shopName: 'Ramesh Kirana',
  description: 'Fresh groceries daily',
  address: '123 Main Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  latitude: 19.076,
  longitude: 72.8777,
  openingTime: '08:00',
  closingTime: '22:00',
};

afterEach(() => {
  jest.clearAllMocks();
});

// ========================================
// GET /vendors/profile
// ========================================
describe('GET /vendors/profile', () => {
  it('should return 200 with vendor profile', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValue(MOCK_VENDOR_PROFILE);

    const res = await request(app)
      .get('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.shopName).toBe('Ramesh Kirana');
    expect(res.body.data.city).toBe('Mumbai');
    expect(res.body.message).toBe('Vendor profile retrieved');
  });

  it('should return 404 when profile does not exist', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/vendors/profile');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('should return 403 when customer accesses vendor route', async () => {
    const res = await request(app)
      .get('/vendors/profile')
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

// ========================================
// POST /vendors/profile
// ========================================
describe('POST /vendors/profile', () => {
  it('should create vendor profile and return 201', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.vendorProfile.create as jest.Mock).mockResolvedValue({
      ...MOCK_VENDOR_PROFILE,
    });

    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.shopName).toBe('Ramesh Kirana');
    expect(res.body.message).toBe('Vendor profile created');
  });

  it('should return 409 when profile already exists', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValue(MOCK_VENDOR_PROFILE);

    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PROFILE_EXISTS');
  });

  it('should return 400 when shopName is missing', async () => {
    const { shopName: _, ...payload } = VALID_CREATE_PAYLOAD;

    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when address is missing', async () => {
    const { address: _, ...payload } = VALID_CREATE_PAYLOAD;

    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('should return 400 when city is missing', async () => {
    const { city: _, ...payload } = VALID_CREATE_PAYLOAD;

    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('should return 400 when pincode is invalid', async () => {
    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ ...VALID_CREATE_PAYLOAD, pincode: '12345' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when latitude is out of range', async () => {
    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ ...VALID_CREATE_PAYLOAD, latitude: 100 });

    expect(res.status).toBe(400);
  });

  it('should return 400 when deliveryRadius exceeds 50km', async () => {
    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ ...VALID_CREATE_PAYLOAD, deliveryRadius: 60 });

    expect(res.status).toBe(400);
  });

  it('should return 400 when openingTime format is invalid', async () => {
    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ ...VALID_CREATE_PAYLOAD, openingTime: '8am' });

    expect(res.status).toBe(400);
  });

  it('should accept optional GST number', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.vendorProfile.create as jest.Mock).mockResolvedValue({
      ...MOCK_VENDOR_PROFILE,
      gstNumber: '27AABCU9603R1ZM',
    });

    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ ...VALID_CREATE_PAYLOAD, gstNumber: '27AABCU9603R1ZM' });

    expect(res.status).toBe(201);
    expect(res.body.data.gstNumber).toBe('27AABCU9603R1ZM');
  });

  it('should return 400 when GST number format is invalid', async () => {
    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ ...VALID_CREATE_PAYLOAD, gstNumber: 'INVALID' });

    expect(res.status).toBe(400);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).post('/vendors/profile').send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(401);
  });

  it('should return 403 when customer tries to create vendor profile', async () => {
    const res = await request(app)
      .post('/vendors/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(403);
  });
});

// ========================================
// PATCH /vendors/profile
// ========================================
describe('PATCH /vendors/profile', () => {
  it('should update vendor profile and return 200', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValue(MOCK_VENDOR_PROFILE);
    (mockedPrisma.vendorProfile.update as jest.Mock).mockResolvedValue({
      ...MOCK_VENDOR_PROFILE,
      shopName: 'Updated Kirana',
      isOpen: true,
    });

    const res = await request(app)
      .patch('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ shopName: 'Updated Kirana', isOpen: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.shopName).toBe('Updated Kirana');
    expect(res.body.data.isOpen).toBe(true);
    expect(res.body.message).toBe('Vendor profile updated');
  });

  it('should return 404 when profile does not exist', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .patch('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ shopName: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('should return 400 when pincode format is invalid on update', async () => {
    const res = await request(app)
      .patch('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ pincode: 'ABC' });

    expect(res.status).toBe(400);
  });

  it('should allow setting nullable fields to null', async () => {
    (mockedPrisma.vendorProfile.findUnique as jest.Mock).mockResolvedValue(MOCK_VENDOR_PROFILE);
    (mockedPrisma.vendorProfile.update as jest.Mock).mockResolvedValue({
      ...MOCK_VENDOR_PROFILE,
      description: null,
      gstNumber: null,
    });

    const res = await request(app)
      .patch('/vendors/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ description: null, gstNumber: null });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBeNull();
    expect(res.body.data.gstNumber).toBeNull();
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).patch('/vendors/profile').send({ shopName: 'Test' });

    expect(res.status).toBe(401);
  });

  it('should return 403 when customer tries to update vendor profile', async () => {
    const res = await request(app)
      .patch('/vendors/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ shopName: 'Test' });

    expect(res.status).toBe(403);
  });
});
