process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { connect, closeDatabase, clearDatabase } = require('../testSetup');

let analystToken;
let adminToken;

async function registerAndLogin(email, role) {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email, password: 'Password123', role });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Password123' });
  return res.body.data.token;
}

beforeAll(async () => {
  await connect();
});
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

beforeEach(async () => {
  analystToken = await registerAndLogin('analyst@test.com', 'analyst');
  adminToken = await registerAndLogin('admin@test.com', 'admin');
});

const baseTx = {
  senderAccount: 'ACC-0001',
  receiverAccount: 'ACC-0002',
  amount: 5000,
  transactionType: 'transfer',
  paymentMethod: 'upi',
  location: 'Bangalore',
};

describe('Transaction API', () => {
  test('rejects unauthenticated create', async () => {
    const res = await request(app).post('/api/transactions').send(baseTx);
    expect(res.status).toBe(401);
  });

  test('creates a low-risk transaction with a low risk score', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`)
      .send(baseTx);
    expect(res.status).toBe(201);
    expect(res.body.data.riskLevel).toBe('low');
    expect(res.body.data.fraudStatus).toBe('clean');
  });

  test('flags a very-high-amount transaction as suspicious', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ ...baseTx, amount: 600000 });
    expect(res.status).toBe(201);
    expect(res.body.data.riskScore).toBeGreaterThanOrEqual(30);
    expect(res.body.data.fraudStatus).toBe('flagged');
    expect(res.body.data.suspicionReasons.length).toBeGreaterThan(0);
  });

  test('rejects invalid transaction payload', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ ...baseTx, amount: -10 });
    expect(res.status).toBe(422);
  });

  test('lists transactions with pagination metadata', async () => {
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${analystToken}`).send(baseTx);
    const res = await request(app)
      .get('/api/transactions?page=1&limit=10')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBe(1);
  });

  test('only admin can delete a transaction', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`)
      .send(baseTx);
    const id = createRes.body.data._id;

    const forbidden = await request(app)
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${analystToken}`);
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(allowed.status).toBe(200);
  });

  test('returns 404 for a non-existent transaction id', async () => {
    const res = await request(app)
      .get('/api/transactions/64b64b64b64b64b64b64b64b')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(404);
  });
});
