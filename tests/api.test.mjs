import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.mjs';

function startServer() {
  const server = createServer();
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

test('GET /api/menu returns catalog', async () => {
  const { server, baseUrl } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/menu`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.items));
    assert.ok(data.items.length > 0);
  } finally {
    server.close();
  }
});

test('POST /api/orders rejects delivery in MVP', async () => {
  const { server, baseUrl } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-1',
        mode: 'delivery',
        payWithPoints: false,
        items: [{ id: 'latte-oat', qty: 1 }]
      })
    });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.match(body.error, /coming soon/i);
  } finally {
    server.close();
  }
});

test('POST /api/auth/login validates payload and invalid json', async () => {
  const { server, baseUrl } = await startServer();
  try {
    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'bad', password: '123' })
    });
    assert.equal(badLogin.status, 400);

    const badJson = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{'
    });
    assert.equal(badJson.status, 400);
    const json = await badJson.json();
    assert.equal(json.error, 'Invalid JSON body.');
  } finally {
    server.close();
  }
});
