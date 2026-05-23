import type { ApiErrorBody, ApiSuccess } from "@/lib/api-response";
import type {
  CreateReservationInput,
  ProductWithStock,
  ReservationWithDetails,
} from "@/types";
import type { Warehouse } from "@prisma/client";

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

const BASE_URL =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = (await res.json()) as ApiSuccess<T> | ApiErrorBody;

  if (!res.ok || !("success" in json) || !json.success) {
    const err = json as ApiErrorBody;
    throw new ApiClientError(
      err.error?.message ?? "Request failed",
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

export async function confirmReservation(
  id: string,
): Promise<ReservationWithDetails> {
  const data = await request<{ reservation: ReservationWithDetails }>(
    `/api/reservations/${id}/confirm`,
    { method: "POST" },
  );
  return data.reservation;
}

export async function releaseReservation(
  id: string,
): Promise<ReservationWithDetails> {
  const data = await request<{ reservation: ReservationWithDetails }>(
    `/api/reservations/${id}/release`,
    { method: "POST" },
  );
  return data.reservation;
}
