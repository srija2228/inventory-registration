import { PrismaClient, ReservationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

// Seeds use DIRECT_URL so they work even when the pooler (6543) is unreachable.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("Seeding database...");

  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo123", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Srija Chamada",
        email: "srija@allo.com",
        password: passwordHash,
        role: "admin",
      },
      {
        name: "Demo User",
        email: "demo@allo.com",
        password: passwordHash,
        role: "operator",
      },
    ],
  });

  const mumbai = await prisma.warehouse.create({
    data: { name: "Mumbai Central", location: "Mumbai, Maharashtra" },
  });
  const delhi = await prisma.warehouse.create({
    data: { name: "Delhi North Hub", location: "New Delhi, Delhi" },
  });
  const bangalore = await prisma.warehouse.create({
    data: { name: "Bangalore Tech Park", location: "Bangalore, Karnataka" },
  });

  const sony = await prisma.product.create({
    data: {
      name: "Sony WH-1000XM5 Headphones",
      sku: "SONY-WH1000XM5-BLK",
      price: 29990,
      description: "Industry-leading noise canceling wireless headphones",
    },
  });
  const iphone = await prisma.product.create({
    data: {
      name: "Apple iPhone 15 128GB",
      sku: "APPL-IPH15-128-BLK",
      price: 79900,
      description: "Latest iPhone with Dynamic Island and USB-C",
    },
  });
  const samsung = await prisma.product.create({
    data: {
      name: "Samsung 65 inch 4K QLED TV",
      sku: "SAMS-QN65Q80C-BLK",
      price: 89990,
      description: "Quantum HDR QLED Smart TV",
    },
  });
  const dyson = await prisma.product.create({
    data: {
      name: "Dyson V15 Detect Vacuum",
      sku: "DYSO-V15-DETECT-NKL",
      price: 52900,
      description: "Laser dust detection with HEPA filtration",
    },
  });
  const macbook = await prisma.product.create({
    data: {
      name: "MacBook Air M2 256GB",
      sku: "APPL-MBA-M2-256-SLV",
      price: 114900,
      description: "Supercharged by M2 chip, 13.6 Liquid Retina display",
    },
  });
  const oneplus = await prisma.product.create({
    data: {
      name: "OnePlus 12 256GB",
      sku: "ONEP-12-256-SLV",
      price: 64999,
      description: "Hasselblad camera, 100W SUPERVOOC charging",
    },
  });

  const inventoryData = [
    { productId: sony.id, warehouseId: mumbai.id, totalStock: 50, reservedStock: 5 },
    { productId: sony.id, warehouseId: delhi.id, totalStock: 30, reservedStock: 2 },
    { productId: sony.id, warehouseId: bangalore.id, totalStock: 2, reservedStock: 1 },
    { productId: iphone.id, warehouseId: mumbai.id, totalStock: 20, reservedStock: 8 },
    { productId: iphone.id, warehouseId: delhi.id, totalStock: 15, reservedStock: 3 },
    { productId: iphone.id, warehouseId: bangalore.id, totalStock: 1, reservedStock: 0 },
    { productId: samsung.id, warehouseId: mumbai.id, totalStock: 10, reservedStock: 2 },
    { productId: samsung.id, warehouseId: delhi.id, totalStock: 8, reservedStock: 0 },
    { productId: samsung.id, warehouseId: bangalore.id, totalStock: 0, reservedStock: 0 },
    { productId: dyson.id, warehouseId: mumbai.id, totalStock: 25, reservedStock: 4 },
    { productId: dyson.id, warehouseId: delhi.id, totalStock: 1, reservedStock: 0 },
    { productId: dyson.id, warehouseId: bangalore.id, totalStock: 12, reservedStock: 1 },
    { productId: macbook.id, warehouseId: mumbai.id, totalStock: 5, reservedStock: 2 },
    { productId: macbook.id, warehouseId: delhi.id, totalStock: 3, reservedStock: 1 },
    { productId: macbook.id, warehouseId: bangalore.id, totalStock: 8, reservedStock: 0 },
    { productId: oneplus.id, warehouseId: mumbai.id, totalStock: 40, reservedStock: 6 },
    { productId: oneplus.id, warehouseId: delhi.id, totalStock: 35, reservedStock: 4 },
    { productId: oneplus.id, warehouseId: bangalore.id, totalStock: 22, reservedStock: 3 },
  ];

  for (const inv of inventoryData) {
    await prisma.inventory.create({ data: inv });
  }

  const now = new Date();

  await prisma.reservation.create({
    data: {
      productId: iphone.id,
      warehouseId: mumbai.id,
      quantity: 2,
      status: ReservationStatus.PENDING,
      expiresAt: new Date(now.getTime() + 8 * 60 * 1000),
    },
  });
  await prisma.reservation.create({
    data: {
      productId: sony.id,
      warehouseId: delhi.id,
      quantity: 1,
      status: ReservationStatus.CONFIRMED,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
    },
  });
  await prisma.reservation.create({
    data: {
      productId: macbook.id,
      warehouseId: mumbai.id,
      quantity: 1,
      status: ReservationStatus.RELEASED,
      expiresAt: new Date(now.getTime() - 10 * 60 * 1000),
    },
  });
  await prisma.reservation.create({
    data: {
      productId: dyson.id,
      warehouseId: bangalore.id,
      quantity: 1,
      status: ReservationStatus.PENDING,
      expiresAt: new Date(now.getTime() + 6 * 60 * 1000),
    },
  });

  console.log("Seeding complete!");
  console.log("- 2 users created");
  console.log("- 3 warehouses created");
  console.log("- 6 products created");
  console.log("- 18 inventory records created");
  console.log("- 4 reservations created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
