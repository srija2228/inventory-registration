# Allo Inventory Reservation System

Monorepo with a **separated backend (API)** and **frontend (UI)** for easy evaluation and deployment.

```
inventory-registration/
├── backend/          # API, Prisma, services, tests  →  http://localhost:3001
├── frontend/         # Next.js UI                     →  http://localhost:3000
├── scripts/          # API smoke & concurrency tests
├── package.json      # Workspace root — run everything from here
└── README.md
```

## Quick start

### 1. Prerequisites

- Node.js 20+
- Supabase PostgreSQL (`DATABASE_URL` + `DIRECT_URL`)
- Upstash Redis

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Edit **`backend/.env`** — database, Redis, `CRON_SECRET`  
Edit **`frontend/.env`** — `NEXT_PUBLIC_API_URL=http://localhost:3001`

### 4. Database (first time)

```bash
npm run db:push
npm run db:seed
```

### 5. Run (both apps)

```bash
npm run dev
```

| App | URL |
|-----|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:3001/api/health |

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend together |
| `npm run dev:backend` | API only (port 3001) |
| `npm run dev:frontend` | UI only (port 3000) |
| `npm run build` | Production build both packages |
| `npm test` | Jest unit tests (backend) |
| `npm run test:api` | API smoke tests (backend must be running) |
| `npm run db:push` | Push Prisma schema |
| `npm run db:seed` | Seed sample products & inventory |
| `npm run db:migrate` | Create migration (dev) |
| `npm run db:studio` | Prisma Studio |

---

## Backend (`/backend`)

| Path | Purpose |
|------|---------|
| `src/app/api/` | REST route handlers (thin) |
| `src/services/` | Business logic, transactions, idempotency |
| `src/lib/` | DB, Redis, errors, config |
| `prisma/` | Schema & seed |

**API routes:** `/api/products`, `/api/reservations`, `/api/cron/cleanup`, etc.

---

## Frontend (`/frontend`)

| Path | Purpose |
|------|---------|
| `src/app/` | Pages (catalog, reservation detail) |
| `src/components/` | UI components (shadcn) |
| `src/hooks/` | React Query hooks |
| `src/lib/api-client.ts` | Typed fetch → backend |

---

## Architecture

- **Concurrency:** `SELECT … FOR UPDATE` inside Prisma transactions  
- **Idempotency:** Redis keys `idempotency:reserve:*` and `idempotency:confirm:*` (24h TTL)  
- **Expiry:** Vercel Cron releases expired reservations every minute  

See earlier sections in git history or deploy `backend/` to Vercel with `vercel.json` cron config.

---

## Deployment

1. Deploy **backend** to Vercel (includes cron). Set all `backend/.env` variables.  
2. Deploy **frontend** to Vercel. Set `NEXT_PUBLIC_API_URL` to your backend URL.  
3. Run `npm run db:migrate:prod -w @allo/backend` and seed once.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `npm` not found | Restart terminal after installing Node |
| Products won’t load | Check `NEXT_PUBLIC_API_URL` points to backend |
| DB auth failed | Fix `DATABASE_URL` password in `backend/.env` |
| CORS errors | Set `FRONTEND_URL` in `backend/.env` to your UI origin |
