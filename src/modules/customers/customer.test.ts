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

/** Generate a valid customer access token */
function customerToken(userId = '660e8400-e29b-41d4-a716-446655440001'): string {
  return jwt.sign({ userId, email: 'customer@test.com', role: 'CUSTOMER' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

/** Generate a valid vendor access token */
function vendorToken(userId = '550e8400-e29b-41d4-a716-446655440000'): string {
  return jwt.sign({ userId, email: 'vendor@test.com', role: 'VENDOR' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

const CUSTOMER_USER_ID = '660e8400-e29b-41d4-a716-446655440001';

const MOCK_CUSTOMER_PROFILE = {
  id: 'cust-profile-uuid-1',
  userId: CUSTOMER_USER_ID,
  address: '456 Park Lane',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001',
  latitude: 28.6139,
  longitude: 77.209,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const VALID_CREATE_PAYLOAD = {
  address: '456 Park Lane',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001',
  latitude: 28.6139,
  longitude: 77.209,
};

afterEach(() => {
  jest.clearAllMocks();
});

// ========================================
// GET /customers/profile
// ========================================
describe('GET /customers/profile', () => {
  it('should return 200 with customer profile', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(MOCK_CUSTOMER_PROFILE);

    const res = await request(app)
      .get('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.city).toBe('Delhi');
    expect(res.body.data.pincode).toBe('110001');
    expect(res.body.message).toBe('Customer profile retrieved');
  });

  it('should return 404 when profile does not exist', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/customers/profile');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('should return 403 when vendor accesses customer route', async () => {
    const res = await request(app)
      .get('/customers/profile')
      .set('Authorization', `Bearer ${vendorToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

// ========================================
// POST /customers/profile
// ========================================
describe('POST /customers/profile', () => {
  it('should create customer profile and return 201', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.customerProfile.create as jest.Mock).mockResolvedValue({
      ...MOCK_CUSTOMER_PROFILE,
    });

    const res = await request(app)
      .post('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.city).toBe('Delhi');
    expect(res.body.message).toBe('Customer profile created');
  });

  it('should create profile with empty body (all fields optional)', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.customerProfile.create as jest.Mock).mockResolvedValue({
      ...MOCK_CUSTOMER_PROFILE,
      address: null,
      city: null,
      state: null,
      pincode: null,
      latitude: null,
      longitude: null,
    });

    const res = await request(app)
      .post('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should return 409 when profile already exists', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(MOCK_CUSTOMER_PROFILE);

    const res = await request(app)
      .post('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PROFILE_EXISTS');
  });

  it('should return 400 when pincode is invalid', async () => {
    const res = await request(app)
      .post('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ pincode: '1234' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when latitude is out of range', async () => {
    const res = await request(app)
      .post('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ latitude: 100 });

    expect(res.status).toBe(400);
  });

  it('should return 400 when longitude is out of range', async () => {
    const res = await request(app)
      .post('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ longitude: 200 });

    expect(res.status).toBe(400);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).post('/customers/profile').send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(401);
  });

  it('should return 403 when vendor tries to create customer profile', async () => {
    const res = await request(app)
      .post('/customers/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send(VALID_CREATE_PAYLOAD);

    expect(res.status).toBe(403);
  });
});

// ========================================
// PATCH /customers/profile
// ========================================
describe('PATCH /customers/profile', () => {
  it('should update customer profile and return 200', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(MOCK_CUSTOMER_PROFILE);
    (mockedPrisma.customerProfile.update as jest.Mock).mockResolvedValue({
      ...MOCK_CUSTOMER_PROFILE,
      city: 'Bangalore',
      state: 'Karnataka',
    });

    const res = await request(app)
      .patch('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ city: 'Bangalore', state: 'Karnataka' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.city).toBe('Bangalore');
    expect(res.body.data.state).toBe('Karnataka');
    expect(res.body.message).toBe('Customer profile updated');
  });

  it('should return 404 when profile does not exist', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .patch('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ city: 'Bangalore' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('should return 400 when pincode format is invalid on update', async () => {
    const res = await request(app)
      .patch('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ pincode: 'ABCDEF' });

    expect(res.status).toBe(400);
  });

  it('should allow setting nullable fields to null', async () => {
    (mockedPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue(MOCK_CUSTOMER_PROFILE);
    (mockedPrisma.customerProfile.update as jest.Mock).mockResolvedValue({
      ...MOCK_CUSTOMER_PROFILE,
      address: null,
      latitude: null,
      longitude: null,
    });

    const res = await request(app)
      .patch('/customers/profile')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ address: null, latitude: null, longitude: null });

    expect(res.status).toBe(200);
    expect(res.body.data.address).toBeNull();
    expect(res.body.data.latitude).toBeNull();
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).patch('/customers/profile').send({ city: 'Test' });

    expect(res.status).toBe(401);
  });

  it('should return 403 when vendor tries to update customer profile', async () => {
    const res = await request(app)
      .patch('/customers/profile')
      .set('Authorization', `Bearer ${vendorToken()}`)
      .send({ city: 'Test' });

    expect(res.status).toBe(403);
  });
});
