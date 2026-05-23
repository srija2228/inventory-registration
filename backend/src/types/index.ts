import type { Product, Reservation, ReservationStatus, Warehouse } from "@prisma/client";

export type { ReservationStatus };

/**
 * Computed at read time — never persisted.
 * availableStock = totalStock - reservedStock
 */
export type InventoryAvailability = {
  productId: string;
  warehouseId: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
};

export function computeAvailableStock(totalStock: number, reservedStock: number): number {
  return totalStock - reservedStock;
}

export type InventoryWithStock = {
  id: string;
  productId: string;
  warehouseId: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  createdAt: string;
  updatedAt: string;
  warehouse: Warehouse;
};

/** Product with per-warehouse inventory and computed availableStock. */
export type ProductWithStock = Omit<Product, "price" | "createdAt" | "updatedAt"> & {
  price: number;
  createdAt: string;
  updatedAt: string;
  inventories: InventoryWithStock[];
};

/** Reservation with nested product and warehouse (API-serialized). */
export type ReservationWithDetails = Omit<
  Reservation,
  "createdAt" | "updatedAt" | "expiresAt"
> & {
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  product: Omit<Product, "price" | "createdAt" | "updatedAt"> & {
    price: number;
    createdAt: string;
    updatedAt: string;
  };
  warehouse: Warehouse;
};

export type CreateReservationInput = {
  productId: string;
  warehouseId: string;
  quantity: number;
  idempotencyKey?: string;
};
