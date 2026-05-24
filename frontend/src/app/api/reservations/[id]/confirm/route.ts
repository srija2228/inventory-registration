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
        throw new Error("INVALID_STATE");
      }

      if (locked.expiresAt < new Date()) {
        throw new Error("EXPIRED");
      }

      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: locked.productId,
            warehouseId: locked.warehouseId,
          },
        },
        data: {
          reservedStock: { decrement: locked.quantity },
          totalStock: { decrement: locked.quantity },
        },
      });

      return tx.reservation.update({
        where: { id },
        data: { status: "CONFIRMED" },
        include: { product: true, warehouse: true },
      });
    });

    return NextResponse.json(
      { success: true, data: { reservation: toApiReservation(reservation) } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reservation confirm API error:", error);

    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Reservation not found." },
          },
          { status: 404 },
        );
      }

      if (error.message === "INVALID_STATE") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_RESERVATION_STATE",
              message: "Reservation cannot be confirmed in its current state.",
            },
          },
          { status: 409 },
        );
      }

      if (error.message === "EXPIRED") {
        return NextResponse.json(
          {
            success: false,
            error: { code: "RESERVATION_EXPIRED", message: "This reservation has expired." },
          },
          { status: 410 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Could not confirm reservation." },
      },
      { status: 500 },
    );
  }
}
