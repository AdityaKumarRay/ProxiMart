import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { app } from '../../app.js';
import { prisma } from '../../prisma/client.js';

// Mock Prisma client
jest.mock('../../prisma/client.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

const TEST_USER = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'vendor@test.com',
  password: '', // set in beforeAll
  name: 'Test Vendor',
  phone: '1234567890',
  role: 'VENDOR' as const,
  refreshToken: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeAll(async () => {
  TEST_USER.password = await bcrypt.hash('password123', 10);
});

afterEach(() => {
  jest.clearAllMocks();
});

// ========================================
// POST /auth/register
// ========================================
describe('POST /auth/register', () => {
  const validPayload = {
    email: 'newuser@test.com',
    password: 'securepass123',
    name: 'New User',
    role: 'VENDOR',
  };

  it('should register a new user and return 201 with tokens', async () => {
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.user.create as jest.Mock).mockResolvedValue({
      ...TEST_USER,
      id: 'new-uuid',
      email: validPayload.email,
      name: validPayload.name,
    });
    (mockedPrisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app).post('/auth/register').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      email: validPayload.email,
      name: validPayload.name,
      role: 'VENDOR',
    });
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.message).toBe('User registered successfully');
  });

  it('should return 409 when email already exists', async () => {
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);

    const res = await request(app).post('/auth/register').send(validPayload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('should return 400 for missing email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ password: 'pass1234', name: 'Test', role: 'VENDOR' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validPayload, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for short password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validPayload, password: '1234567' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for missing role', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'a@b.com', password: 'pass1234', name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid role', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validPayload, role: 'ADMIN' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should accept CUSTOMER role', async () => {
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.user.create as jest.Mock).mockResolvedValue({
      ...TEST_USER,
      id: 'cust-uuid',
      email: 'cust@test.com',
      role: 'CUSTOMER',
    });
    (mockedPrisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post('/auth/register')
      .send({ ...validPayload, email: 'cust@test.com', role: 'CUSTOMER' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('CUSTOMER');
  });

  it('should accept optional phone field', async () => {
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.user.create as jest.Mock).mockResolvedValue({
      ...TEST_USER,
      id: 'phone-uuid',
      phone: '9876543210',
    });
    (mockedPrisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post('/auth/register')
      .send({ ...validPayload, phone: '9876543210' });

    expect(res.status).toBe(201);
  });
});

// ========================================
// POST /auth/login
// ========================================
describe('POST /auth/login', () => {
  it('should login with valid credentials and return 200 with tokens', async () => {
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);
    (mockedPrisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_USER.email, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      id: TEST_USER.id,
      email: TEST_USER.email,
      name: TEST_USER.name,
      role: 'VENDOR',
    });
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.message).toBe('Login successful');
  });

  it('should return 401 for non-existent user', async () => {
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 for wrong password', async () => {
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_USER.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 403 for deactivated account', async () => {
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...TEST_USER,
      isActive: false,
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_USER.email, password: 'password123' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_DEACTIVATED');
  });

  it('should return 400 for missing email', async () => {
    const res = await request(app).post('/auth/login').send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for missing password', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'test@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ========================================
// POST /auth/refresh
// ========================================
describe('POST /auth/refresh', () => {
  it('should refresh tokens with a valid refresh token', async () => {
    const refreshToken = jwt.sign(
      { userId: TEST_USER.id, email: TEST_USER.email, role: TEST_USER.role },
      process.env['JWT_REFRESH_SECRET']!,
      { expiresIn: '7d' },
    );

    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...TEST_USER,
      refreshToken,
    });
    (mockedPrisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app).post('/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.message).toBe('Token refreshed successfully');
  });

  it('should return 401 for invalid refresh token', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('should return 401 for token mismatch (reuse attempt)', async () => {
    const refreshToken = jwt.sign(
      { userId: TEST_USER.id, email: TEST_USER.email, role: TEST_USER.role },
      process.env['JWT_REFRESH_SECRET']!,
      { expiresIn: '7d' },
    );

    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...TEST_USER,
      refreshToken: 'different-token-stored-in-db',
    });

    const res = await request(app).post('/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('should return 403 for deactivated account on refresh', async () => {
    const refreshToken = jwt.sign(
      { userId: TEST_USER.id, email: TEST_USER.email, role: TEST_USER.role },
      process.env['JWT_REFRESH_SECRET']!,
      { expiresIn: '7d' },
    );

    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...TEST_USER,
      isActive: false,
      refreshToken,
    });

    const res = await request(app).post('/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_DEACTIVATED');
  });

  it('should return 400 for missing refresh token', async () => {
    const res = await request(app).post('/auth/refresh').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ========================================
// POST /auth/logout
// ========================================
describe('POST /auth/logout', () => {
  it('should logout with valid access token', async () => {
    const accessToken = jwt.sign(
      { userId: TEST_USER.id, email: TEST_USER.email, role: TEST_USER.role },
      process.env['JWT_ACCESS_SECRET']!,
      { expiresIn: '15m' },
    );

    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(TEST_USER);
    (mockedPrisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('should return 401 without authorization header', async () => {
    const res = await request(app).post('/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('should return 401 with expired token', async () => {
    const expiredToken = jwt.sign(
      { userId: TEST_USER.id, email: TEST_USER.email, role: TEST_USER.role },
      process.env['JWT_ACCESS_SECRET']!,
      { expiresIn: '0s' },
    );

    // Small delay to ensure token is expired
    await new Promise((resolve) => setTimeout(resolve, 100));

    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});

// ========================================
// Auth middleware edge cases
// ========================================
describe('Auth middleware', () => {
  it('should return 401 for malformed authorization header', async () => {
    const res = await request(app).post('/auth/logout').set('Authorization', 'NotBearer token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });
});
