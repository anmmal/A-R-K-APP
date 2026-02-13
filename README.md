# A R K App MVP

Lean, mobile-first MVP for A R K Café / Roasters / Tea / Recycle with realistic ordering and loyalty basics.

## Stack (MVP)
- Frontend: Vanilla JS single-page app (mobile-first, bilingual-ready)
- Backend: Node.js HTTP server + REST APIs
- Data: In-memory runtime store + production PostgreSQL schema (`db/schema.sql`)
- Auth: Input validation + mock session response
- Integrations: Shopify/POS boundaries stubbed through API modules

## User flows included
1. Onboarding: guest user can continue quickly, then become registered in one tap.
2. Browse menu: coffee/tea/retail catalog by API.
3. Order flow: pickup ordering with delivery placeholder.
4. Loyalty wallet: points balance, earn/redeem behavior.
5. Impact tracking: honest cup reuse + CO₂ metrics from verified scans.
6. Profile/history: profile identity and order history snapshots.
7. Edge cases: offline mode, empty cart, failed/unavailable payment.

## Run
```bash
npm run dev
```
Then open `http://localhost:3000`.

## API
- `GET /api/menu`
- `POST /api/auth/login`
- `GET /api/wallet`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/impact`
- `GET /api/locations`
