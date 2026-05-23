import { NextResponse } from "next/server";

import { ok } from "@/lib/api-response";
import * as reservationService from "@/services/reservation.service";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or missing cron authorization",
        },
      },
      { status: 401 },
    );
  }

  const released = await reservationService.releaseExpiredReservations();

  return ok({
    released,
    timestamp: new Date().toISOString(),
  });
}
