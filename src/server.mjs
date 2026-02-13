import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOrders, getWallet, placeOrder } from './store.mjs';
import { locations, menuItems, sustainability } from './data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        return resolve(JSON.parse(data));
      } catch {
        return reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });

const routes = {
  'GET /api/menu': (_, res) => json(res, 200, { items: menuItems }),
  'GET /api/wallet': (_, res) => json(res, 200, { wallet: getWallet() }),
  'GET /api/orders': (_, res) => json(res, 200, { orders: getOrders() }),
  'GET /api/impact': (_, res) => json(res, 200, { impact: sustainability, source: 'verified scans only' }),
  'GET /api/locations': (_, res) => json(res, 200, { locations }),
  'POST /api/auth/login': async (req, res) => {
    const body = await readBody(req);
    if (!body.email?.includes('@') || !body.password || body.password.length < 6) {
      return json(res, 400, { error: 'Invalid credentials input.' });
    }
    return json(res, 200, {
      user: { id: 'user-ark-1', name: 'Jane Cooper', email: body.email, locale: 'en-KW' },
      session: { token: 'mock-jwt-token', expiresAt: new Date(Date.now() + 8 * 3600_000).toISOString() }
    });
  },
  'POST /api/orders': async (req, res) => {
    const body = await readBody(req);
    if (!body.userId || !Array.isArray(body.items) || !body.items.length) return json(res, 400, { error: 'Invalid order payload.' });
    if (body.mode === 'delivery') return json(res, 422, { error: 'Delivery is coming soon in MVP.' });
    return json(res, 201, placeOrder(body));
  }
};

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' });
        return res.end();
      }
      const key = `${req.method} ${req.url}`;
      if (routes[key]) return await routes[key](req, res);

      const requested = req.url === '/' ? '/index.html' : req.url;
      const filePath = path.join(publicDir, requested);
      if (filePath.startsWith(publicDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const type = ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : 'text/html';
        res.writeHead(200, { 'Content-Type': type });
        return fs.createReadStream(filePath).pipe(res);
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Not found' }));
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_JSON') {
        return json(res, 400, { error: 'Invalid JSON body.' });
      }
      return json(res, 500, { error: 'Internal server error' });
    }
  });
}

if (process.env.NODE_ENV !== 'test') {
  const server = createServer();
  const port = Number(process.env.PORT || 3000);
  server.listen(port, '0.0.0.0', () => {
    console.log(`A R K app running on http://localhost:${port}`);
  });
}
