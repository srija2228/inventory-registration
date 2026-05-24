export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toApiReservation(reservation: any) {
  return {
    ...reservation,
    product: {
      ...reservation.product,
      price: reservation.product.price.toNumber(),
    },
  };
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const reservation = await db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string; productId: string; warehouseId: string; quantity: number; status: string; expiresAt: Date }[]
      >`
        SELECT id, "productId", "warehouseId", quantity, status, "expiresAt"
        FROM "Reservation"
        WHERE id = ${id}
        FOR UPDATE
      `;

      const locked = rows[0];
      if (!locked) {
        throw new Error("NOT_FOUND");
      }

      if (locked.status !== "PENDING") {
        const existing = await tx.reservation.findUnique({
          where: { id },
          include: { product: true, warehouse: true },
        });
        if (!existing) {
          throw new Error("NOT_FOUND");
        }
        return existing;
      }

      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: locked.productId,
            warehouseId: locked.warehouseId,
          },
        },
        data: { reservedStock: { decrement: locked.quantity } },
      });

      return tx.reservation.update({
        where: { id },
        data: { status: "RELEASED" },
        include: { product: true, warehouse: true },
      });
    });

    return NextResponse.json(
      { success: true, data: { reservation: toApiReservation(reservation) } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reservation release API error:", error);

    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Reservation not found." },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Could not release reservation." },
      },
      { status: 500 },
    );
  }
}
