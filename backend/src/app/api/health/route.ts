import { handleError, ok } from "@/lib/api-response";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

/**
 * Smoke-test endpoint — route handler only, no business logic.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    await redis.ping();

    return ok({
      status: "ok",
      phase: "1-2",
      services: {
        database: true,
        redis: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
