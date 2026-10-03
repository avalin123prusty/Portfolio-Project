import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

process.env.DATABASE_FILE = `analytics-test-${process.pid}.sqlite`;
const dataDirectory = fileURLToPath(new URL('../data/', import.meta.url));
const legacyStorePath = path.join(dataDirectory, `legacy-test-${process.pid}.json`);
process.env.LEGACY_STORE_FILE = legacyStorePath;
process.env.JWT_SECRET = 'analytics-test-secret-long-enough-for-ci-123456';
process.env.REFRESH_TOKEN_SECRET = 'analytics-refresh-secret-long-enough-for-ci-123456';
process.env.ADMIN_EMAIL = 'analytics-admin@example.test';
process.env.ADMIN_PASSWORD = 'AnalyticsAdminPassword-2026!';

fs.mkdirSync(dataDirectory, { recursive: true });
fs.writeFileSync(legacyStorePath, JSON.stringify({
  users: [{ id: 'legacy-admin', email: 'old-admin@example.test', password: 'old-password', role: 'admin' }],
  about: { name: 'Legacy profile' }
}));

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
  fs.rmSync(legacyStorePath, { force: true });
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
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
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