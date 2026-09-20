process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { connect, closeDatabase, clearDatabase } = require('../testSetup');

async function registerAndLogin(email, role) {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email, password: 'Password123', role });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Password123' });
  return res.body.data.token;
}

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

describe('Investigation API', () => {
  test('analyst cannot create an investigation', async () => {
    const analystToken = await registerAndLogin('analyst2@test.com', 'analyst');
    const res = await request(app)
      .post('/api/investigations')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ title: 'Suspicious account activity' });
    expect(res.status).toBe(403);
  });

  test('investigator can create and update an investigation', async () => {
    const investigatorToken = await registerAndLogin('investigator2@test.com', 'investigator');

    const createRes = await request(app)
      .post('/api/investigations')
      .set('Authorization', `Bearer ${investigatorToken}`)
      .send({ title: 'Review large transfers', priority: 'high' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('open');

    const id = createRes.body.data._id;
    const updateRes = await request(app)
      .put(`/api/investigations/${id}`)
      .set('Authorization', `Bearer ${investigatorToken}`)
      .send({ status: 'under_investigation' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('under_investigation');
  });

  test('rejects investigation with too-short title', async () => {
    const investigatorToken = await registerAndLogin('investigator3@test.com', 'investigator');
    const res = await request(app)
      .post('/api/investigations')
      .set('Authorization', `Bearer ${investigatorToken}`)
      .send({ title: 'ab' });
    expect(res.status).toBe(422);
  });
});
