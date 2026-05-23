export const RESERVATION_TTL_SECONDS = parseInt(
  process.env.RESERVATION_TTL_SECONDS ?? "600",
  10,
);

export const IDEMPOTENCY_CACHE_TTL_SECONDS = 24 * 60 * 60;
