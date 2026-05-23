import { z } from "zod";

import { handleError, ok } from "@/lib/api-response";
import * as reservationService from "@/services/reservation.service";

const CreateReservationSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().min(1),
  idempotencyKey: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreateReservationSchema.parse(body);
    const idempotencyKey =
      parsed.idempotencyKey ?? req.headers.get("Idempotency-Key") ?? undefined;

    const reservation = await reservationService.createReservation({
      productId: parsed.productId,
      warehouseId: parsed.warehouseId,
      quantity: parsed.quantity,
      idempotencyKey,
    });

    return ok(
      { reservation: reservationService.toApiReservation(reservation) },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
