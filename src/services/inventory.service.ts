import { db } from "@/lib/db";
import { computeAvailableStock } from "@/types";

export async function getProductsWithStock() {
  const products = await db.product.findMany({
    include: {
      inventories: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return products.map((product) => ({
    ...product,
    price: product.price.toNumber(),
    inventories: product.inventories.map((inventory) => ({
      ...inventory,
      availableStock: computeAvailableStock(
        inventory.totalStock,
        inventory.reservedStock,
      ),
    })),
  }));
}

export async function getWarehouses() {
  return db.warehouse.findMany({
    orderBy: { name: "asc" },
  });
}
