import { handleError, ok } from "@/lib/api-response";
import * as inventoryService from "@/services/inventory.service";

export async function GET() {
  try {
    const products = await inventoryService.getProductsWithStock();
    return ok({ products }, 200);
  } catch (error) {
    return handleError(error);
  }
}
