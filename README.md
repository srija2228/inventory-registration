# Inventory Reservation System

Concurrency-safe inventory reservations with PostgreSQL row locking (`SELECT … FOR UPDATE`), Redis idempotency, and automatic expiry cleanup.

## Setup

```bash
cp .env.example .env
# Set DATABASE_URL, DIRECT_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CRON_SECRET

npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## API tests (Prompt 2)

With the dev server running on `http://localhost:3000`:

```bash
# Static checklist (no server / DB required)
npm run test:verify

# Full API smoke test (6 curl scenarios)
npm run test:api

# Parallel reserve against 1-unit stock (1×201, 1×409)
npm run test:concurrency
```

Or run everything:

```bash
npm run test:all
```

### Concurrency demo

`scripts/concurrency-test.mjs` fires two simultaneous `POST /api/reservations` requests for **Mechanical Keyboard @ Mumbai** (seed: `totalStock = 1`). Row locking ensures exactly one succeeds and the other returns `409 INSUFFICIENT_STOCK`.

Re-seed if stock was consumed by earlier tests:

```bash
npm run db:seed
npm run test:concurrency
```

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | Products with per-warehouse `availableStock` |
| GET | `/api/warehouses` | All warehouses |
| POST | `/api/reservations` | Create pending reservation |
| POST | `/api/reservations/:id/confirm` | Confirm (deduct stock) |
| POST | `/api/reservations/:id/release` | Release reserved units |
| GET | `/api/cron/cleanup` | Release expired reservations (Bearer `CRON_SECRET`) |
