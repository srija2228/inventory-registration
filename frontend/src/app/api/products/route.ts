export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";

function formatProduct(product: any) {
  return {
    ...product,
    price: product.price.toNumber(),
    inventories: product.inventories.map((inventory: any) => ({
      ...inventory,
      availableStock: inventory.totalStock - inventory.reservedStock,
      warehouse: inventory.warehouse,
    })),
  };
}

export async function GET() {
  try {
    const products = await db.product.findMany({
      include: {
        inventories: {
          include: { warehouse: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      { success: true, data: { products: products.map(formatProduct) } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Could not load products." },
      },
      { status: 500 },
    );
  }
}
