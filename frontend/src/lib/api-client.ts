import type {
  ApiErrorBody,
  ApiSuccess,
  CreateReservationInput,
  ProductWithStock,
  ReservationWithDetails,
  Warehouse,
} from "@/types";

export class ApiClientError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Browser: relative `/api/*` (proxied to backend via next.config rewrites).
 * Server: absolute app URL for SSR.
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  let json: ApiSuccess<T> | ApiErrorBody;
  try {
    json = (await res.json()) as ApiSuccess<T> | ApiErrorBody;
  } catch {
    throw new ApiClientError(
      `Invalid JSON from ${path} (HTTP ${res.status})`,
      "INVALID_RESPONSE",
      res.status,
    );
  }

  if (!res.ok || !("success" in json) || !json.success) {
    const err = json as ApiErrorBody;
    throw new ApiClientError(
      err.error?.message ?? `Request failed: ${path}`,
      err.error?.code ?? "UNKNOWN_ERROR",
      res.status,
    );
  }

  return json.data;
}

export async function getProducts(): Promise<ProductWithStock[]> {
  const data = await request<{ products: ProductWithStock[] }>("/api/products");
  return data.products;
}

export async function getWarehouses(): Promise<Warehouse[]> {
  const data = await request<{ warehouses: Warehouse[] }>("/api/warehouses");
  return data.warehouses;
}

export async function getReservations(): Promise<ReservationWithDetails[]> {
  const data = await request<{ reservations: ReservationWithDetails[] }>(
    "/api/reservations",
  );
  return data.reservations;
}

export async function getReservation(id: string): Promise<ReservationWithDetails> {
  const data = await request<{ reservation: ReservationWithDetails }>(
    `/api/reservations/${id}`,
  );
  return data.reservation;
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<ReservationWithDetails> {
  const headers: HeadersInit = {};
  if (input.idempotencyKey) {
    headers["Idempotency-Key"] = input.idempotencyKey;
  }

  const data = await request<{ reservation: ReservationWithDetails }>(
    "/api/reservations",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        idempotencyKey: input.idempotencyKey,
      }),
    },
  );

  return data.reservation;
}

export async function confirmReservation(id: string): Promise<ReservationWithDetails> {
  const data = await request<{ reservation: ReservationWithDetails }>(
    `/api/reservations/${id}/confirm`,
    { method: "POST" },
  );
  return data.reservation;
}

export async function releaseReservation(id: string): Promise<ReservationWithDetails> {
  const data = await request<{ reservation: ReservationWithDetails }>(
    `/api/reservations/${id}/release`,
    { method: "POST" },
  );
  return data.reservation;
}
