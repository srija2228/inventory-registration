export const dynamic = "force-dynamic";

import { handleError, ok } from "@/lib/api-response";
import { redis } from "@/lib/redis";
import * as inventoryService from "@/services/inventory.service";

const CACHE_KEY = "cache:warehouses";
const CACHE_TTL = 300; // 5 minutes (warehouses rarely change)

export async function GET() {
  try {
    // Check cache first
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return ok(typeof cached === "string" ? JSON.parse(cached) : cached, 200);
    }

    // Cache miss — hit database
    const warehouses = await inventoryService.getWarehouses();
    const payload = { warehouses };

    // Store in Redis for 5 minutes
    await redis.set(CACHE_KEY, JSON.stringify(payload), { ex: CACHE_TTL });

    return ok(payload, 200);
  } catch (error) {
    return handleError(error);
  }
}
