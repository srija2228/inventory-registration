/**
 * End-to-end API smoke test (Prompt 2 manual curl checklist).
 *
 * Usage:
 *   node scripts/api-smoke-test.mjs
 *   BASE_URL=http://localhost:3000 node scripts/api-smoke-test.mjs
 */

const BASE_URL = process.env.API_URL ?? process.env.BASE_URL ?? "http://localhost:3000";
const WAREHOUSE_MUMBAI = "seed-wh-mumbai";

let passed = 0;
let failed = 0;

function log(icon, message) {
  console.log(`${icon} ${message}`);
}

function assert(condition, message) {
  if (condition) {
    passed += 1;
    log("✓", message);
    return;
  }
  failed += 1;
  log("✗", message);
  throw new Error(message);
}

async function request(method, path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: res.status, json };
}

async function main() {
  console.log(`\nAPI smoke test → ${BASE_URL}\n`);

  // 1. GET /api/products
  const productsRes = await request("GET", "/api/products");
  assert(productsRes.status === 200, `GET /api/products → 200 (got ${productsRes.status})`);
  assert(productsRes.json?.success === true, "products response has success: true");
  const products = productsRes.json?.data?.products;
  assert(Array.isArray(products) && products.length > 0, "products array is non-empty");

  const keyboard = products.find((p) => p.sku === "SKU-KB-002");
  assert(keyboard, "seed product SKU-KB-002 (Mechanical Keyboard) exists");
  const mumbaiInv = keyboard.inventories?.find((i) => i.warehouseId === WAREHOUSE_MUMBAI);
  assert(mumbaiInv, "keyboard inventory at Mumbai exists");
  assert(
    typeof mumbaiInv.availableStock === "number",
    "availableStock is computed on inventory",
  );
  assert(
    mumbaiInv.availableStock === mumbaiInv.totalStock - mumbaiInv.reservedStock,
    "availableStock = totalStock - reservedStock",
  );

  // 2. GET /api/warehouses
  const warehousesRes = await request("GET", "/api/warehouses");
  assert(warehousesRes.status === 200, `GET /api/warehouses → 200 (got ${warehousesRes.status})`);
  const warehouses = warehousesRes.json?.data?.warehouses;
  assert(Array.isArray(warehouses) && warehouses.length >= 3, "warehouses array has seed data");
  assert(
    warehouses.some((w) => w.id === WAREHOUSE_MUMBAI),
    "Mumbai warehouse (seed-wh-mumbai) present",
  );

  const productId = keyboard.id;
  const warehouseId = WAREHOUSE_MUMBAI;
  const reserveQty = 1;

  // 3. POST /api/reservations (success)
  const createRes = await request("POST", "/api/reservations", {
    headers: { "Idempotency-Key": `smoke-${Date.now()}` },
    body: { productId, warehouseId, quantity: reserveQty },
  });
  assert(createRes.status === 201, `POST /api/reservations → 201 (got ${createRes.status})`);
  const reservation = createRes.json?.data?.reservation;
  assert(reservation?.id, "reservation has id");
  assert(reservation.status === "PENDING", "reservation status is PENDING");
  assert(reservation.product?.sku === "SKU-KB-002", "reservation includes product");
  assert(reservation.warehouse?.id === WAREHOUSE_MUMBAI, "reservation includes warehouse");

  const reservationId = reservation.id;

  // 4. POST /api/reservations (409 insufficient stock — exhaust remaining Mumbai keyboard stock)
  const oversellRes = await request("POST", "/api/reservations", {
    body: { productId, warehouseId, quantity: 999 },
  });
  assert(
    oversellRes.status === 409,
    `POST /api/reservations (oversell) → 409 (got ${oversellRes.status})`,
  );
  assert(
    oversellRes.json?.error?.code === "INSUFFICIENT_STOCK",
    "oversell error code is INSUFFICIENT_STOCK",
  );

  // 5. POST confirm
  const confirmRes = await request("POST", `/api/reservations/${reservationId}/confirm`);
  assert(
    confirmRes.status === 200,
    `POST /api/reservations/:id/confirm → 200 (got ${confirmRes.status})`,
  );
  assert(
    confirmRes.json?.data?.reservation?.status === "CONFIRMED",
    "confirmed reservation status is CONFIRMED",
  );

  // 6. POST release on a fresh pending reservation
  const hub = products.find((p) => p.sku === "SKU-HUB-003");
  assert(hub, "seed product SKU-HUB-003 exists");
  const delhiInv = hub.inventories?.find((i) => i.warehouseId === "seed-wh-delhi");
  assert(delhiInv, "hub inventory at Delhi exists");

  const releaseCreateRes = await request("POST", "/api/reservations", {
    body: {
      productId: hub.id,
      warehouseId: "seed-wh-delhi",
      quantity: 1,
    },
  });
  assert(releaseCreateRes.status === 201, "created reservation for release test");
  const releaseId = releaseCreateRes.json.data.reservation.id;

  const releaseRes = await request("POST", `/api/reservations/${releaseId}/release`);
  assert(
    releaseRes.status === 200,
    `POST /api/reservations/:id/release → 200 (got ${releaseRes.status})`,
  );
  assert(
    releaseRes.json?.data?.reservation?.status === "RELEASED",
    "released reservation status is RELEASED",
  );

  const releaseAgainRes = await request("POST", `/api/reservations/${releaseId}/release`);
  assert(releaseAgainRes.status === 200, "second release is idempotent (200)");
  assert(
    releaseAgainRes.json?.data?.reservation?.status === "RELEASED",
    "idempotent release still RELEASED",
  );

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error("\nSmoke test failed:", error.message);
  if (error.cause) console.error(error.cause);
  process.exit(1);
});
