/**
 * Concurrency demo: two parallel reservations against 1-unit stock.
 * Exactly one should succeed (201); the other should get 409 INSUFFICIENT_STOCK.
 *
 * Targets: Mechanical Keyboard (SKU-KB-002) @ Mumbai — seed totalStock = 1.
 *
 * Usage:
 *   node scripts/concurrency-test.mjs
 *   BASE_URL=http://localhost:3000 node scripts/concurrency-test.mjs
 */

const BASE_URL = process.env.API_URL ?? process.env.BASE_URL ?? "http://localhost:3000";
const WAREHOUSE_MUMBAI = "seed-wh-mumbai";
const TARGET_SKU = "SKU-KB-002";

async function fetchJson(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function getKeyboardMumbaiProductId() {
  const { status, json } = await fetchJson("GET", "/api/products");
  if (status !== 200) {
    throw new Error(`GET /api/products failed with ${status}`);
  }
  const product = json.data.products.find((p) => p.sku === TARGET_SKU);
  if (!product) {
    throw new Error(`Product ${TARGET_SKU} not found — run npm run db:seed`);
  }
  const inv = product.inventories.find((i) => i.warehouseId === WAREHOUSE_MUMBAI);
  if (!inv) {
    throw new Error("Mumbai inventory not found for keyboard");
  }
  return { productId: product.id, available: inv.availableStock };
}

async function resetMumbaiKeyboardStock() {
  // Release any PENDING reservations via API isn't enough if CONFIRMED exists.
  // Smoke path: we only reserve 1; if stock is 0, user should re-seed.
  const { available } = await getKeyboardMumbaiProductId();
  if (available >= 1) return;
  console.warn(
    `⚠ Mumbai keyboard availableStock=${available}. Re-seed for a clean run:\n` +
      "  npm run db:seed\n",
  );
}

async function reserveOnce(productId, label) {
  const started = performance.now();
  const { status, json } = await fetchJson("POST", "/api/reservations", {
    productId,
    warehouseId: WAREHOUSE_MUMBAI,
    quantity: 1,
    idempotencyKey: `concurrency-${label}-${crypto.randomUUID()}`,
  });
  const elapsed = Math.round(performance.now() - started);
  return { label, status, json, elapsed };
}

async function main() {
  console.log(`\nConcurrency test → ${BASE_URL}`);
  console.log(`Target: ${TARGET_SKU} @ ${WAREHOUSE_MUMBAI} (1 unit in seed)\n`);

  await resetMumbaiKeyboardStock();
  const { productId, available } = await getKeyboardMumbaiProductId();

  if (available < 1) {
    console.error(
      `Cannot run concurrency test: availableStock=${available}. ` +
        "Run `npm run db:seed` to reset inventory.",
    );
    process.exit(1);
  }

  console.log(`productId=${productId}, availableStock=${available}`);
  console.log("Firing 2 parallel POST /api/reservations …\n");

  const [a, b] = await Promise.all([
    reserveOnce(productId, "A"),
    reserveOnce(productId, "B"),
  ]);

  for (const r of [a, b]) {
    const code = r.json?.error?.code ?? r.json?.data?.reservation?.status ?? "?";
    console.log(
      `  [${r.label}] HTTP ${r.status} (${r.elapsed}ms) — ${r.status === 201 ? "PENDING" : code}`,
    );
    if (r.status === 409) {
      console.log(`         ${r.json?.error?.message ?? ""}`);
    }
  }

  const successes = [a, b].filter((r) => r.status === 201);
  const conflicts = [a, b].filter((r) => r.status === 409);

  console.log("");
  if (successes.length === 1 && conflicts.length === 1) {
    console.log("✓ PASS: exactly 1 success and 1 INSUFFICIENT_STOCK — no oversell.");
    const winner = successes[0];
    console.log(`  Winner reservation: ${winner.json.data.reservation.id}`);
    console.log("  Cleaning up: releasing pending reservation …");

    const releaseRes = await fetchJson(
      "POST",
      `/api/reservations/${winner.json.data.reservation.id}/release`,
    );
    if (releaseRes.status === 200) {
      console.log("  ✓ Released — stock returned to pool.\n");
    } else {
      console.warn(`  ⚠ Release returned ${releaseRes.status}\n`);
    }
    return;
  }

  console.error(
    `✗ FAIL: expected 1×201 and 1×409, got ${successes.length}×201 and ${conflicts.length}×409.`,
  );
  if (successes.length === 2) {
    console.error("  Both succeeded — row locking may not be active (oversold risk).");
  }
  process.exit(1);
}

main().catch((error) => {
  console.error("\nConcurrency test error:", error.message);
  process.exit(1);
});
