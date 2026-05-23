import { Decimal } from "@prisma/client/runtime/library";

import { RESERVATION_TTL_SECONDS } from "@/lib/config";
import {
  InsufficientStockError,
  ReservationExpiredError,
} from "@/lib/errors";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import {
  confirmReservation,
  createReservation,
  releaseReservation,
} from "@/services/reservation.service";

jest.mock("@/lib/db", () => ({
  db: {
    $transaction: jest.fn(),
    reservation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockRedis = redis as jest.Mocked<typeof redis>;

const productId = "product-1";
const warehouseId = "warehouse-1";
const reservationId = "reservation-1";

function buildReservation(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: reservationId,
    productId,
    warehouseId,
    quantity: 1,
    status: "PENDING" as const,
    expiresAt: new Date(now.getTime() + RESERVATION_TTL_SECONDS * 1000),
    idempotencyKey: null,
    createdAt: now,
    updatedAt: now,
    product: {
      id: productId,
      name: "Test Product",
      description: null,
      sku: "SKU-TEST",
      price: new Decimal(99.99),
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
    },
    warehouse: {
      id: warehouseId,
      name: "Test Warehouse",
      location: "Test City",
      createdAt: now,
      updatedAt: now,
    },
    ...overrides,
  };
}

function mockTransaction(tx: Record<string, unknown>) {
  (mockDb.$transaction as jest.Mock).mockImplementation(
    async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
  );
}

describe("Reservation Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue("OK");
  });

  test("creates reservation when stock is available", async () => {
    const created = buildReservation();
    const mockTx = {
      $queryRaw: jest.fn().mockResolvedValue([
        { id: "inv-1", totalStock: 10, reservedStock: 0 },
      ]),
      inventory: {
        update: jest.fn().mockResolvedValue({}),
      },
      reservation: {
        create: jest.fn().mockResolvedValue(created),
      },
    };
    mockTransaction(mockTx);

    const result = await createReservation({
      productId,
      warehouseId,
      quantity: 1,
    });

    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.inventory.update).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: { reservedStock: { increment: 1 } },
    });
    expect(mockTx.reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          quantity: 1,
        }),
      }),
    );
    expect(result.status).toBe("PENDING");
    const expiresMs = result.expiresAt.getTime() - Date.now();
    expect(expiresMs).toBeGreaterThan((RESERVATION_TTL_SECONDS - 30) * 1000);
    expect(expiresMs).toBeLessThanOrEqual(RESERVATION_TTL_SECONDS * 1000);
  });

  test("throws InsufficientStockError when no stock available", async () => {
    const mockTx = {
      $queryRaw: jest.fn().mockResolvedValue([
        { id: "inv-1", totalStock: 5, reservedStock: 5 },
      ]),
      inventory: { update: jest.fn() },
      reservation: { create: jest.fn() },
    };
    mockTransaction(mockTx);

    await expect(
      createReservation({ productId, warehouseId, quantity: 1 }),
    ).rejects.toThrow(InsufficientStockError);
    expect(mockTx.reservation.create).not.toHaveBeenCalled();
    expect(mockTx.inventory.update).not.toHaveBeenCalled();
  });

  test("throws InsufficientStockError when quantity exceeds available", async () => {
    const mockTx = {
      $queryRaw: jest.fn().mockResolvedValue([
        { id: "inv-1", totalStock: 10, reservedStock: 8 },
      ]),
      inventory: { update: jest.fn() },
      reservation: { create: jest.fn() },
    };
    mockTransaction(mockTx);

    await expect(
      createReservation({ productId, warehouseId, quantity: 3 }),
    ).rejects.toThrow(InsufficientStockError);
    expect(mockTx.reservation.create).not.toHaveBeenCalled();
  });

  test("returns cached result for duplicate idempotency key", async () => {
    const cached = buildReservation({ id: "cached-reservation" });
    mockRedis.get.mockResolvedValue(
      JSON.stringify({
        ...cached,
        expiresAt: cached.expiresAt.toISOString(),
        createdAt: cached.createdAt.toISOString(),
        updatedAt: cached.updatedAt.toISOString(),
        product: {
          ...cached.product,
          price: 99.99,
          createdAt: cached.product.createdAt.toISOString(),
          updatedAt: cached.product.updatedAt.toISOString(),
        },
        warehouse: {
          ...cached.warehouse,
          createdAt: cached.warehouse.createdAt.toISOString(),
          updatedAt: cached.warehouse.updatedAt.toISOString(),
        },
      }),
    );

    const result = await createReservation({
      productId,
      warehouseId,
      quantity: 1,
      idempotencyKey: "dup-key-123",
    });

    expect(mockDb.$transaction).not.toHaveBeenCalled();
    expect(result.id).toBe("cached-reservation");
    expect(mockRedis.get).toHaveBeenCalledWith("idempotency:reserve:dup-key-123");
  });

  test("confirm returns 410 for expired reservation", async () => {
    const expiredAt = new Date(Date.now() - 60 * 60 * 1000);
    const mockTx = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: reservationId,
          productId,
          warehouseId,
          quantity: 1,
          status: "PENDING",
          expiresAt: expiredAt,
        },
      ]),
      inventory: { update: jest.fn() },
      reservation: { update: jest.fn() },
    };
    mockTransaction(mockTx);

    await expect(confirmReservation(reservationId)).rejects.toThrow(
      ReservationExpiredError,
    );
    expect(mockTx.inventory.update).not.toHaveBeenCalled();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  test("release is idempotent — already released reservation returns without error", async () => {
    const released = buildReservation({ status: "RELEASED" });
    const mockTx = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: reservationId,
          productId,
          warehouseId,
          quantity: 1,
          status: "RELEASED",
          expiresAt: new Date(Date.now() + 60_000),
        },
      ]),
      inventory: { update: jest.fn() },
      reservation: {
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(released),
      },
    };
    mockTransaction(mockTx);

    const result = await releaseReservation(reservationId);

    expect(mockTx.reservation.update).not.toHaveBeenCalled();
    expect(mockTx.inventory.update).not.toHaveBeenCalled();
    expect(result.status).toBe("RELEASED");
  });

  test("confirm decrements both reservedStock and totalStock", async () => {
    const confirmed = buildReservation({ status: "CONFIRMED", quantity: 2 });
    const mockTx = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: reservationId,
          productId,
          warehouseId,
          quantity: 2,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 60_000),
        },
      ]),
      inventory: {
        update: jest.fn().mockResolvedValue({}),
      },
      reservation: {
        update: jest.fn().mockResolvedValue(confirmed),
      },
    };
    mockTransaction(mockTx);

    const result = await confirmReservation(reservationId);

    expect(mockTx.inventory.update).toHaveBeenCalledWith({
      where: {
        productId_warehouseId: { productId, warehouseId },
      },
      data: {
        reservedStock: { decrement: 2 },
        totalStock: { decrement: 2 },
      },
    });
    expect(result.status).toBe("CONFIRMED");
    expect(mockRedis.set).toHaveBeenCalledWith(
      `idempotency:confirm:${reservationId}`,
      expect.any(String),
      { ex: expect.any(Number) },
    );
  });
});
