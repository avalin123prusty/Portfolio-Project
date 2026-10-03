import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

process.env.DATABASE_FILE = `analytics-test-${process.pid}.sqlite`;
process.env.JWT_SECRET = 'analytics-test-secret-long-enough-for-ci-123456';
process.env.REFRESH_TOKEN_SECRET = 'analytics-refresh-secret-long-enough-for-ci-123456';
process.env.ADMIN_EMAIL = 'admin@portfolio.local';
process.env.ADMIN_PASSWORD = 'admin123';

const { app } = await import('../src/server.js');
let server;
let baseUrl;
let token;

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  const closed = once(server, 'close');
  server.close();
  server.closeAllConnections();
  await closed;
});

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('connection', 'close');
  return fetch(`${baseUrl}${path}`, { ...options, headers });
}

test('analytics requires an access token', async () => {
  const response = await request('/api/admin/analytics');
  assert.equal(response.status, 401);
});

test('admin analytics summarizes content and inbox totals', async () => {
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@portfolio.local', password: 'admin123' })
  });
  assert.equal(login.status, 200);
  token = (await login.json()).token;

  const response = await request('/api/admin/analytics', {
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(response.status, 200);
  const analytics = await response.json();
  assert.equal(typeof analytics.totals.projects, 'number');
  assert.equal(typeof analytics.totals.messages, 'number');
  assert.equal(typeof analytics.recentMessages, 'number');
  assert.ok(Array.isArray(analytics.latestMessages));
});