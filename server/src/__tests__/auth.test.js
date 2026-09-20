process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { connect, closeDatabase, clearDatabase } = require('../testSetup');

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

describe('Auth API', () => {
  const validUser = {
    name: 'Test User',
    email: 'test.user@example.com',
    password: 'Password123',
  };

  test('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('rejects registration with a weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(409);
  });

  test('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('rejects login with incorrect password', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'WrongPassword1' });
    expect(res.status).toBe(401);
  });

  test('protects /me route without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns current user with a valid token', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(validUser);
    const token = registerRes.body.data.token;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });
});
