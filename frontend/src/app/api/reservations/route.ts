export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const CreateReservationSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().min(1),
  idempotencyKey: z.string().min(1).optional(),
});

function toApiReservation(reservation: any) {
  return {
    ...reservation,
    product: {
      ...reservation.product,
      price: reservation.product.price.toNumber(),
    },
  };
}

export async function GET() {
  try {
    const reservations = await db.reservation.findMany({
      orderBy: { createdAt: "desc" },
      include: { product: true, warehouse: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          reservations: reservations.map(toApiReservation),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reservations API GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Could not load reservations." },
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreateReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid reservation request",
          },
        },
        { status: 422 },
      );
    }

    const { productId, warehouseId, quantity, idempotencyKey } = parsed.data;
    const ttlSeconds = parseInt(process.env.RESERVATION_TTL_SECONDS ?? "600", 10);

    const reservation = await db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string; totalStock: number; reservedStock: number }[]
      >`
        SELECT id, "totalStock", "reservedStock"
        FROM "Inventory"
        WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
        FOR UPDATE
      `;

      const inventory = rows[0];
      if (!inventory) {
        throw new Error("NOT_FOUND");
      }

      const available = inventory.totalStock - inventory.reservedStock;
      if (available < quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${available}`);
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: { reservedStock: { increment: quantity } },
      });

      return tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: "PENDING",
          expiresAt: new Date(Date.now() + ttlSeconds * 1000),
          idempotencyKey: idempotencyKey ?? null,
        },
        include: { product: true, warehouse: true },
      });
    });

    return NextResponse.json(
      { success: true, data: { reservation: toApiReservation(reservation) } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Reservations API POST error:", error);

    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Inventory not found for the selected product and warehouse.",
            },
          },
          { status: 404 },
        );
      }

      if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
        const available = parseInt(error.message.split(":")[1] ?? "0", 10);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INSUFFICIENT_STOCK",
              message: `Only ${available} items are available for reservation.`,
            },
          },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Could not create reservation." },
      },
      { status: 500 },
    );
  }
}

