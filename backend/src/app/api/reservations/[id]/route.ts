import { handleError, ok } from "@/lib/api-response";
import * as reservationService from "@/services/reservation.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const reservation = await reservationService.getReservationById(id);
    return ok(
      { reservation: reservationService.toApiReservation(reservation) },
      200,
    );
  } catch (error) {
    return handleError(error);
  }
}
