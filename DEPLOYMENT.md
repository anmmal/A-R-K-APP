# A R K App Deployment Runbook

This runbook provides production commands for deploying the current repository structure.

## 1) Production prerequisites

- Node.js 20+
- PostgreSQL 14+
- `psql` CLI installed in CI/CD runner and in your ops terminal
- Domain + HTTPS termination at load balancer / platform edge

## 2) Environment variables

Set these in your runtime platform:

```bash
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://app.arkcoffee.com
CORS_ALLOW_ORIGIN=https://app.arkcoffee.com
DATABASE_URL=postgres://<user>:<password>@<host>:5432/ark_app?sslmode=require
JWT_SECRET=<replace-with-64-char-secret>
```

## 3) One-time database bootstrap

### 3.1 Create database
```bash
createdb ark_app
```

### 3.2 Apply baseline schema
```bash
export DATABASE_URL='postgres://<user>:<password>@<host>:5432/ark_app?sslmode=require'
node scripts/migrate.mjs baseline
```

### 3.3 Check migration status
```bash
node scripts/migrate.mjs status
```

## 4) Rolling out SQL migrations

1. Add a new file under `db/migrations/` (example: `20260213_add_index_orders_created_at.sql`).
2. Apply pending migrations:

```bash
export DATABASE_URL='postgres://<user>:<password>@<host>:5432/ark_app?sslmode=require'
node scripts/migrate.mjs up
```

3. Verify status:

```bash
node scripts/migrate.mjs status
```

## 5) Build and run app

### 5.1 Install dependencies
```bash
npm install
```

### 5.2 Execute automated tests (must pass before release)
```bash
npm test
```

### 5.3 Start service
```bash
NODE_ENV=production PORT=3000 node src/server.mjs
```

## 6) Container image commands (optional)

If deploying as container, build and run:

```bash
docker build -t ark-app:latest .
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_URL='postgres://<user>:<password>@<host>:5432/ark_app?sslmode=require' \
  ark-app:latest
```

## 7) Post-deploy smoke tests

Run these from CI/CD or ops terminal:

```bash
export APP_BASE_URL='https://app.arkcoffee.com'

curl --fail --silent --show-error "$APP_BASE_URL/api/menu" | head -c 200 && echo
curl --fail --silent --show-error "$APP_BASE_URL/api/impact" | head -c 200 && echo
curl --fail --silent --show-error -X POST "$APP_BASE_URL/api/orders" \
  -H 'content-type: application/json' \
  -d '{"userId":"smoke-user","mode":"pickup","payWithPoints":false,"items":[{"id":"latte-oat","qty":1}]}'
```

## 8) Rollback

- Roll back the app release to previous image/version in your platform.
- If a migration caused the issue, apply the corresponding down SQL manually (recommended to keep paired rollback scripts with every migration file).
- Re-run smoke tests after rollback.

## 9) Operational checklist before opening to real users

- [ ] `npm test` green on release commit
- [ ] DB baseline applied and migration status verified
- [ ] HTTPS, domain, and CORS locked to app domain
- [ ] Monitoring + error alerting enabled
- [ ] Smoke tests green against production URL
