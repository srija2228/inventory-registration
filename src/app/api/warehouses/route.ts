import { handleError, ok } from "@/lib/api-response";
import * as inventoryService from "@/services/inventory.service";

export async function GET() {
  try {
    const warehouses = await inventoryService.getWarehouses();
    return ok({ warehouses }, 200);
  } catch (error) {
    return handleError(error);
  }
}
