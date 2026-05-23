import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  const warehouses = await Promise.all([
    prisma.warehouse.upsert({
      where: { id: "seed-wh-mumbai" },
      update: {},
      create: { id: "seed-wh-mumbai", name: "Mumbai FC", location: "Mumbai, Maharashtra" },
    }),
    prisma.warehouse.upsert({
      where: { id: "seed-wh-delhi" },
      update: {},
      create: { id: "seed-wh-delhi", name: "Delhi FC", location: "Delhi, NCR" },
    }),
    prisma.warehouse.upsert({
      where: { id: "seed-wh-bangalore" },
      update: {},
      create: {
        id: "seed-wh-bangalore",
        name: "Bangalore FC",
        location: "Bangalore, Karnataka",
      },
    }),
  ]);

  console.log("Warehouses:");
  for (const w of warehouses) {
    console.log(`  - ${w.name} (${w.location}) [${w.id}]`);
  }

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "SKU-EB-001" },
      update: {},
      create: {
        name: "Wireless Earbuds Pro",
        description: "Active noise cancelling earbuds with 32h battery case",
        sku: "SKU-EB-001",
        price: 79.99,
        imageUrl: "https://placehold.co/400x400?text=Earbuds",
      },
    }),
    prisma.product.upsert({
      where: { sku: "SKU-KB-002" },
      update: {},
      create: {
        name: "Mechanical Keyboard TKL",
        description: "Hot-swappable switches, RGB, USB-C",
        sku: "SKU-KB-002",
        price: 149.99,
        imageUrl: "https://placehold.co/400x400?text=Keyboard",
      },
    }),
    prisma.product.upsert({
      where: { sku: "SKU-HUB-003" },
      update: {},
      create: {
        name: "USB-C Hub 7-in-1",
        description: "HDMI, SD card, 100W PD pass-through",
        sku: "SKU-HUB-003",
        price: 49.99,
        imageUrl: "https://placehold.co/400x400?text=Hub",
      },
    }),
    prisma.product.upsert({
      where: { sku: "SKU-STD-004" },
      update: {},
      create: {
        name: "Aluminum Laptop Stand",
        description: "Ergonomic adjustable stand for 13-16 inch laptops",
        sku: "SKU-STD-004",
        price: 39.99,
        imageUrl: "https://placehold.co/400x400?text=Stand",
      },
    }),
    prisma.product.upsert({
      where: { sku: "SKU-CAM-005" },
      update: {},
      create: {
        name: "HD Webcam 1080p",
        description: "Auto-focus, built-in mic, privacy shutter",
        sku: "SKU-CAM-005",
        price: 89.99,
        imageUrl: "https://placehold.co/400x400?text=Webcam",
      },
    }),
  ]);

  console.log("\nProducts:");
  for (const p of products) {
    console.log(`  - ${p.name} (${p.sku}) ₹${p.price} [${p.id}]`);
  }

  // totalStock per [productIndex][warehouseIndex] — Mumbai, Delhi, Bangalore
  // Include 1–2 unit rows for concurrency demos
  const stockMatrix: number[][] = [
    [2, 10, 5], // Earbuds — Mumbai only 2 units
    [1, 3, 8], // Keyboard — Mumbai only 1 unit
    [15, 2, 12], // Hub — Delhi only 2 units
    [20, 20, 1], // Stand — Bangalore only 1 unit
    [5, 1, 6], // Webcam — Delhi only 1 unit
  ];

  console.log("\nInventory (totalStock per product × warehouse):");
  for (let pi = 0; pi < products.length; pi++) {
    for (let wi = 0; wi < warehouses.length; wi++) {
      const totalStock = stockMatrix[pi][wi];
      const inv = await prisma.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: products[pi].id,
            warehouseId: warehouses[wi].id,
          },
        },
        update: { totalStock, reservedStock: 0 },
        create: {
          productId: products[pi].id,
          warehouseId: warehouses[wi].id,
          totalStock,
          reservedStock: 0,
        },
      });
      const available = inv.totalStock - inv.reservedStock;
      console.log(
        `  - ${products[pi].sku} @ ${warehouses[wi].name}: total=${inv.totalStock}, reserved=${inv.reservedStock}, available=${available}`,
      );
    }
  }

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
