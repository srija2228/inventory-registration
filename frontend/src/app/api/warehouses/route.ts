export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET() {
  try {
    const warehouses = await db.warehouse.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      { success: true, data: { warehouses } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Warehouses API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Could not load warehouses." },
      },
      { status: 500 },
    );
  }
}
