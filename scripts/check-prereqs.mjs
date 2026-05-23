/**
 * Ensures .env exists and /api/health responds before live API tests.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

if (!fs.existsSync(envPath)) {
  console.error("\n✗ Missing .env file.");
  console.error("  cp .env.example .env");
  console.error("  Fill DATABASE_URL, DIRECT_URL, UPSTASH_REDIS_*, CRON_SECRET\n");
  process.exit(1);
}

try {
  const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
  const json = await res.json();
  if (res.status !== 200 || !json?.data?.services?.database) {
    console.error(`\n✗ Health check failed (${res.status}). Is the dev server running?`);
    console.error("  npm run dev\n");
    process.exit(1);
  }
  console.log(`✓ Server healthy at ${BASE_URL}\n`);
} catch {
  console.error(`\n✗ Cannot reach ${BASE_URL}/api/health`);
  console.error("  npm run dev\n");
  process.exit(1);
}
