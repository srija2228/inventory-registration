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

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const reservation = await db.reservation.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });

    if (!reservation) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Reservation not found." },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, data: { reservation: toApiReservation(reservation) } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reservation by ID API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Could not load reservation." },
      },
      { status: 500 },
    );
  }
}
