/**
 * Static checklist: Prompt 2 file/function requirements (no server needed).
 * Usage: node scripts/verify-prompt.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "src/services/reservation.service.ts",
  "src/services/inventory.service.ts",
  "src/app/api/products/route.ts",
  "src/app/api/warehouses/route.ts",
  "src/app/api/reservations/route.ts",
  "src/app/api/reservations/[id]/confirm/route.ts",
  "src/app/api/reservations/[id]/release/route.ts",
  "src/app/api/cron/cleanup/route.ts",
  "vercel.json",
];

const contentChecks = [
  {
    file: "src/services/reservation.service.ts",
    includes: [
      "createReservation",
      "confirmReservation",
      "releaseReservation",
      "releaseExpiredReservations",
      "FOR UPDATE",
      "$transaction",
      "idempotency:",
    ],
  },
  {
    file: "src/services/inventory.service.ts",
    includes: ["getProductsWithStock", "getWarehouses", "availableStock"],
  },
  {
    file: "src/app/api/reservations/route.ts",
    includes: ["CreateReservationSchema", "Idempotency-Key", "createReservation"],
  },
  {
    file: "src/app/api/cron/cleanup/route.ts",
    includes: ["CRON_SECRET", "releaseExpiredReservations"],
  },
  {
    file: ".env.example",
    includes: ["CRON_SECRET"],
  },
  {
    file: "vercel.json",
    includes: ["/api/cron/cleanup"],
  },
];

let ok = 0;
let fail = 0;

function pass(msg) {
  ok += 1;
  console.log(`✓ ${msg}`);
}

function failMsg(msg) {
  fail += 1;
  console.log(`✗ ${msg}`);
}

console.log("\nPrompt 2 structure verification\n");

for (const rel of requiredFiles) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) pass(`exists: ${rel}`);
  else failMsg(`missing: ${rel}`);
}

for (const { file, includes } of contentChecks) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failMsg(`cannot read: ${file}`);
    continue;
  }
  const text = fs.readFileSync(full, "utf8");
  for (const needle of includes) {
    if (text.includes(needle)) pass(`${file} contains "${needle}"`);
    else failMsg(`${file} missing "${needle}"`);
  }
}

console.log(`\n${ok} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
