import type { ProductWithStock, ReservationWithDetails } from "@/types";

export type WarehouseMetrics = {
  warehouseId: string;
  name: string;
  totalSkus: number;
  stockedSkus: number;
  totalStock: number;
  reserved: number;
  available: number;
  healthPercent: number;
};

export type LowStockAlert = {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  available: number;
};

export function computeWarehouseMetrics(products: ProductWithStock[]): WarehouseMetrics[] {
  const map = new Map<string, WarehouseMetrics>();

  for (const product of products) {
    for (const inv of product.inventories) {
      const existing = map.get(inv.warehouseId) ?? {
        warehouseId: inv.warehouseId,
        name: inv.warehouse.name,
        totalSkus: 0,
        stockedSkus: 0,
        totalStock: 0,
        reserved: 0,
        available: 0,
        healthPercent: 0,
      };

      existing.totalSkus += 1;
      if (inv.availableStock > 0) existing.stockedSkus += 1;
      existing.totalStock += inv.totalStock;
      existing.reserved += inv.reservedStock;
      existing.available += inv.availableStock;

      map.set(inv.warehouseId, existing);
    }
  }

  return Array.from(map.values())
    .map((w) => ({
      ...w,
      healthPercent:
        w.totalStock > 0 ? Math.round((w.available / w.totalStock) * 100) : 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getLowStockAlerts(products: ProductWithStock[]): LowStockAlert[] {
  const alerts: LowStockAlert[] = [];

  for (const product of products) {
    for (const inv of product.inventories) {
      if (inv.availableStock > 0 && inv.availableStock < 5) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          warehouseId: inv.warehouseId,
          warehouseName: inv.warehouse.name,
          available: inv.availableStock,
        });
      }
    }
  }

  return alerts.sort((a, b) => a.available - b.available);
}

export function getTopLowStockAlerts(
  products: ProductWithStock[],
  limit = 3,
): LowStockAlert[] {
  return getLowStockAlerts(products).slice(0, limit);
}

export function countReservationsByStatus(reservations: ReservationWithDetails[]) {
  return {
    pending: reservations.filter((r) => r.status === "PENDING").length,
    confirmed: reservations.filter((r) => r.status === "CONFIRMED").length,
    released: reservations.filter((r) => r.status === "RELEASED").length,
  };
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name.split(" ")[0]}`;
  if (hour < 17) return `Good afternoon, ${name.split(" ")[0]}`;
  return `Good evening, ${name.split(" ")[0]}`;
}

export function healthBarColor(percent: number): string {
  if (percent >= 75) return "bg-emerald-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-red-500";
}
