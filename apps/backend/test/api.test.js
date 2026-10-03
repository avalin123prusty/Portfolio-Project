import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

process.env.DATABASE_FILE = `test-${process.pid}.sqlite`;
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-ci-123456';
process.env.ADMIN_EMAIL = 'admin@portfolio.local';
process.env.ADMIN_PASSWORD = 'admin123';

const { app } = await import('../src/server.js');
let server;
let baseUrl;
let token;
let refreshToken;

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

test('health endpoint responds', async () => {
  const response = await request('/api/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'ok');
});

test('login rejects invalid credentials and returns a token for the seeded admin', async () => {
  const denied = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@portfolio.local', password: 'wrong' })
  });
  assert.equal(denied.status, 401);

  const accepted = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@portfolio.local', password: 'admin123' })
  });
  assert.equal(accepted.status, 200);
  const result = await accepted.json();
  assert.equal(result.user.role, 'admin');
  assert.ok(result.token);
  assert.ok(result.refreshToken);
  token = result.token;
  refreshToken = result.refreshToken;
});

test('refresh endpoint rotates refresh credentials and rejects access tokens', async () => {
  const consumedRefreshToken = refreshToken;
  const rotated = await request('/api/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  assert.equal(rotated.status, 200);
  const credentials = await rotated.json();
  assert.ok(credentials.token);
  assert.ok(credentials.refreshToken);
  token = credentials.token;
  refreshToken = credentials.refreshToken;

  const replay = await request('/api/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: consumedRefreshToken })
  });
  assert.equal(replay.status, 403);

  const denied = await request('/api/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: token })
  });
  assert.equal(denied.status, 403);

  const logout = await request('/api/auth/logout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  assert.equal(logout.status, 204);
  const revoked = await request('/api/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  assert.equal(revoked.status, 403);
});

test('messages require admin authentication', async () => {
  const response = await request('/api/messages');
  assert.equal(response.status, 401);

  const accepted = await request('/api/messages', {
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(accepted.status, 200);
  assert.ok(Array.isArray(await accepted.json()));
});

test('project CRUD requires authentication and persists valid content', async () => {
  const denied = await request('/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Private write', description: 'No token' })
  });
  assert.equal(denied.status, 401);

  const created = await request('/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'API test project', description: 'Created by the integration suite.', status: 'draft' })
  });
  assert.equal(created.status, 201);
  const project = await created.json();
  assert.ok(project.id);

  const publicProjects = await request('/api/projects');
  assert.ok(!(await publicProjects.json()).some((item) => item.id === project.id));
  const adminProjects = await request('/api/projects', {
    headers: { authorization: `Bearer ${token}` }
  });
  assert.ok((await adminProjects.json()).some((item) => item.id === project.id));

  const updated = await request(`/api/projects/${project.id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...project, title: 'Updated API test project' })
  });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).title, 'Updated API test project');

  const deleted = await request(`/api/projects/${project.id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(deleted.status, 200);
});

test('contact form validates and stores messages without returning private data', async () => {
  const invalid = await request('/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Visitor', email: 'invalid', message: 'short' })
  });
  assert.equal(invalid.status, 400);

  const accepted = await request('/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Visitor', email: 'visitor@example.com', message: 'This is a valid contact message.' })
  });
  assert.equal(accepted.status, 201);
  const result = await accepted.json();
  assert.equal(result.message, 'Your message was received successfully.');
  assert.equal(result.emailSent, false);
});

test('contact form rate limit rejects excess submissions', async () => {
  const payload = { name: 'Visitor', email: 'visitor@example.com', message: 'This is a valid contact message.' };
  for (let index = 0; index < 3; index += 1) {
    const response = await request('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.equal(response.status, 201);
  }
  const limited = await request('/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  assert.equal(limited.status, 429);
});

test('media upload validates file types and supports listing and deletion', async () => {
  const form = new FormData();
  form.append('image', new Blob(['not an image'], { type: 'text/plain' }), 'note.txt');
  const response = await request('/api/upload/image', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: form
  });
  assert.equal(response.status, 400);

  const spoofedForm = new FormData();
  spoofedForm.append('image', new Blob(['not an image'], { type: 'image/png' }), 'spoofed.png');
  const spoofedResponse = await request('/api/upload/image', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: spoofedForm
  });
  assert.equal(spoofedResponse.status, 400);
  assert.match((await spoofedResponse.json()).message, /not a valid image/i);

  const imageForm = new FormData();
  imageForm.append('image', new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }), 'pixel.png');
  const uploaded = await request('/api/upload/image', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: imageForm
  });
  assert.equal(uploaded.status, 201);
  const media = (await uploaded.json()).item;
  assert.ok(media.id);

  const listed = await request('/api/media', { headers: { authorization: `Bearer ${token}` } });
  assert.equal(listed.status, 200);
  assert.ok((await listed.json()).some((item) => item.id === media.id));

  const deleted = await request(`/api/media/${media.id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(deleted.status, 200);
});