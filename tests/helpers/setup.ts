/**
 * Global test setup.
 * Sets NODE_ENV to 'test' and provides shared test configuration.
 */

// Ensure test environment
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '4000';
process.env['LOG_LEVEL'] = 'error';
process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/proximart_test';
process.env['REDIS_URL'] = 'redis://localhost:6379';
process.env['RABBITMQ_URL'] = 'amqp://guest:guest@localhost:5672';
process.env['JWT_ACCESS_SECRET'] = 'test-access-secret-minimum-32-characters-long';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-minimum-32-characters-long';
process.env['SARVAM_API_KEY'] = 'test-sarvam-key';
process.env['ML_SERVICE_URL'] = 'http://localhost:8000';
process.env['CORS_ORIGIN'] = 'http://localhost:3000';
