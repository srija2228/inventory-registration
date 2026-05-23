import { handleError, ok } from "@/lib/api-response";
import { redis } from "@/lib/redis";
import * as inventoryService from "@/services/inventory.service";

const CACHE_KEY = "cache:products";
const CACHE_TTL = 30; // 30 seconds

export async function GET() {
  try {
    // Check cache first
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return ok(typeof cached === "string" ? JSON.parse(cached) : cached, 200);
    }

    // Cache miss — hit database
    const products = await inventoryService.getProductsWithStock();
    const payload = { products };

    // Store in Redis for 30 seconds
    await redis.set(CACHE_KEY, JSON.stringify(payload), { ex: CACHE_TTL });

    return ok(payload, 200);
  } catch (error) {
    console.error("Products API error:", error);
    return handleError(error);
  }
}
