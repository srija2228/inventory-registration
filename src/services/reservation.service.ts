import type { Prisma, ReservationStatus } from "@prisma/client";

import { IDEMPOTENCY_CACHE_TTL_SECONDS, RESERVATION_TTL_SECONDS } from "@/lib/config";
import { db } from "@/lib/db";
import {
  AppError,
  InsufficientStockError,
  ReservationExpiredError,
  ReservationNotFoundError,
} from "@/lib/errors";
import { redis } from "@/lib/redis";

const reservationInclude = {
  product: true,
  warehouse: true,
} satisfies Prisma.ReservationInclude;

export type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;

export type CreateReservationInput = {
  productId: string;
  warehouseId: string;
  quantity: number;
  idempotencyKey?: string;
};

/** API-safe reservation (price as number for JSON). */
export function toApiReservation(reservation: ReservationWithRelations) {
  return {
    ...reservation,
    product: {
      ...reservation.product,
      price: reservation.product.price.toNumber(),
    },
  };
}

type InventoryLockRow = {
  id: string;
  totalStock: number;
  reservedStock: number;
};

type ReservationLockRow = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
};

function idempotencyRedisKey(key: string) {
  return `idempotency:${key}`;
}

function serializeReservationCache(reservation: ReservationWithRelations) {
  return JSON.stringify({
    ...reservation,
    expiresAt: reservation.expiresAt.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    product: {
      ...reservation.product,
      price: reservation.product.price.toNumber(),
      createdAt: reservation.product.createdAt.toISOString(),
      updatedAt: reservation.product.updatedAt.toISOString(),
    },
    warehouse: {
      ...reservation.warehouse,
      createdAt: reservation.warehouse.createdAt.toISOString(),
      updatedAt: reservation.warehouse.updatedAt.toISOString(),
    },
  });
}

function deserializeReservation(raw: string): ReservationWithRelations {
  const parsed = JSON.parse(raw) as ReservationWithRelations & {
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    product: ReservationWithRelations["product"] & {
      createdAt: string;
      updatedAt: string;
    };
    warehouse: ReservationWithRelations["warehouse"] & {
      createdAt: string;
      updatedAt: string;
    };
  };

  return {
    ...parsed,
    expiresAt: new Date(parsed.expiresAt),
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
    product: {
      ...parsed.product,
      createdAt: new Date(parsed.product.createdAt),
      updatedAt: new Date(parsed.product.updatedAt),
    },
    warehouse: {
      ...parsed.warehouse,
      createdAt: new Date(parsed.warehouse.createdAt),
      updatedAt: new Date(parsed.warehouse.updatedAt),
    },
  };
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<ReservationWithRelations> {
  const { productId, warehouseId, quantity, idempotencyKey } = input;

  if (idempotencyKey) {
    const cached = await redis.get<string>(idempotencyRedisKey(idempotencyKey));
    if (cached) {
      return deserializeReservation(
        typeof cached === "string" ? cached : JSON.stringify(cached),
      );
    }
  }

  const reservation = await db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<InventoryLockRow[]>`
      SELECT id, "totalStock", "reservedStock"
      FROM "Inventory"
      WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
      FOR UPDATE
    `;

    const inventory = rows[0];
    if (!inventory) {
      throw new ReservationNotFoundError(
        "Inventory not found for the given product and warehouse",
      );
    }

    const available = inventory.totalStock - inventory.reservedStock;
    if (available < quantity) {
      throw new InsufficientStockError(available, quantity);
    }

    await tx.inventory.update({
      where: { id: inventory.id },
      data: { reservedStock: { increment: quantity } },
    });

    const expiresAt = new Date(Date.now() + RESERVATION_TTL_SECONDS * 1000);

    return tx.reservation.create({
      data: {
        productId,
        warehouseId,
        quantity,
        status: "PENDING",
        expiresAt,
        idempotencyKey: idempotencyKey ?? null,
      },
      include: reservationInclude,
    });
  });

  if (idempotencyKey) {
    await redis.set(idempotencyRedisKey(idempotencyKey), serializeReservationCache(reservation), {
      ex: IDEMPOTENCY_CACHE_TTL_SECONDS,
    });
  }

  return reservation;
}

export async function confirmReservation(
  reservationId: string,
): Promise<ReservationWithRelations> {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ReservationLockRow[]>`
      SELECT id, "productId", "warehouseId", quantity, status, "expiresAt"
      FROM "Reservation"
      WHERE id = ${reservationId}
      FOR UPDATE
    `;

    const locked = rows[0];
    if (!locked) {
      throw new ReservationNotFoundError();
    }

    if (locked.status !== "PENDING") {
      throw new AppError(
        `Reservation is already ${locked.status.toLowerCase()}`,
        409,
        "INVALID_RESERVATION_STATE",
      );
    }

    if (locked.expiresAt < new Date()) {
      throw new ReservationExpiredError();
    }

    await tx.inventory.update({
      where: {
        productId_warehouseId: {
          productId: locked.productId,
          warehouseId: locked.warehouseId,
        },
      },
      data: {
        reservedStock: { decrement: locked.quantity },
        totalStock: { decrement: locked.quantity },
      },
    });

    return tx.reservation.update({
      where: { id: reservationId },
      data: { status: "CONFIRMED" },
      include: reservationInclude,
    });
  });
}

export async function releaseReservation(
  reservationId: string,
): Promise<ReservationWithRelations> {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ReservationLockRow[]>`
      SELECT id, "productId", "warehouseId", quantity, status, "expiresAt"
      FROM "Reservation"
      WHERE id = ${reservationId}
      FOR UPDATE
    `;

    const locked = rows[0];
    if (!locked) {
      throw new ReservationNotFoundError();
    }

    if (locked.status !== "PENDING") {
      const existing = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: reservationInclude,
      });
      if (!existing) {
        throw new ReservationNotFoundError();
      }
      return existing;
    }

    await tx.inventory.update({
      where: {
        productId_warehouseId: {
          productId: locked.productId,
          warehouseId: locked.warehouseId,
        },
      },
      data: { reservedStock: { decrement: locked.quantity } },
    });

    return tx.reservation.update({
      where: { id: reservationId },
      data: { status: "RELEASED" },
      include: reservationInclude,
    });
  });
}

export async function getReservationById(
  reservationId: string,
): Promise<ReservationWithRelations> {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: reservationInclude,
  });

  if (!reservation) {
    throw new ReservationNotFoundError();
  }

  return reservation;
}

export async function releaseExpiredReservations(): Promise<number> {
  const expired = await db.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    take: 100,
    select: { id: true },
  });

  let released = 0;

  for (const { id } of expired) {
    try {
      await releaseReservation(id);
      released += 1;
    } catch (error) {
      console.error(`[cron] Failed to release expired reservation ${id}:`, error);
    }
  }

  return released;
}
