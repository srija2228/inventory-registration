# Deployment guide (Vercel)

This monorepo has two Next.js apps: **frontend** (UI + auth) and **backend** (API + Prisma + cron).

## Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: add auth and production config"
git push origin main
```

## Step 2: Connect Vercel (two projects)

### Project A — Backend API

1. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
2. Set **Root Directory** to `backend`.
3. Framework: **Next.js** (auto-detected).
4. Build command: `npm run build` (runs `prisma generate && next build`).

### Project B — Frontend UI

1. Create a second Vercel project from the same repo.
2. Set **Root Directory** to `frontend`.
3. Build command: `npm run build`.

## Step 3: Environment variables

Copy values from `.env.production.example` into each Vercel project.

**Backend**

- `DATABASE_URL`, `DIRECT_URL` — from Supabase → Connect
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET`, `RESERVATION_TTL_SECONDS`
- `FRONTEND_URL` — your frontend Vercel URL

**Frontend**

- `NEXT_PUBLIC_APP_URL` — frontend URL
- `API_PROXY_URL` — backend URL (e.g. `https://your-api.vercel.app`)
- `DATABASE_URL`, `DIRECT_URL` — same as backend (for NextAuth + signup)
- `NEXTAUTH_URL` — frontend URL
- `NEXTAUTH_SECRET` — generate with: `openssl rand -base64 32`

## Step 4: Deploy

Deploy both projects. Note each deployment URL.

Update `API_PROXY_URL` on the frontend if the backend URL changed, then redeploy frontend.

## Step 5: Run migrations on production DB

From your machine (with production `DATABASE_URL` / `DIRECT_URL`):

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

## Step 6: Test the live URL

1. Open the frontend URL → `/auth/login`
2. Sign in with `srija@allo.com` / `demo123`
3. Reserve a product and confirm the countdown timer
4. Confirm purchase on the reservation detail page

## Cron

The backend `vercel.json` runs `/api/cron/cleanup` every minute. Set `CRON_SECRET` and ensure the cleanup route validates it.
