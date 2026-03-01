import request from 'supertest';
import { app } from '../../app.js';

describe('GET /health', () => {
  it('should return 200 with health check data', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: 'Server is healthy',
    });
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(typeof res.body.data.uptime).toBe('number');
    expect(typeof res.body.data.timestamp).toBe('string');
  });

  it('should return a valid ISO timestamp', async () => {
    const res = await request(app).get('/health');

    const timestamp = new Date(res.body.data.timestamp as string);
    expect(timestamp.toISOString()).toBe(res.body.data.timestamp);
  });
});

describe('404 handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  it('should return 404 for unknown POST routes', async () => {
    const res = await request(app).post('/nonexistent').send({ foo: 'bar' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
