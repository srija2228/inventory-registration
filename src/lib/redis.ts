import { Redis } from "@upstash/redis";

let client: Redis | null = null;

function getRedisClient(): Redis {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Missing Upstash Redis configuration. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment.",
    );
  }

  client = new Redis({ url, token });
  return client;
}

/** Lazy Redis client — avoids throwing at import time during `next build`. */
export const redis: Redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const instance = getRedisClient();
    const value = instance[prop as keyof Redis];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
});
