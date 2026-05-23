"use client";

import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/use-products";
import {
  computeWarehouseMetrics,
  getLowStockAlerts,
  healthBarColor,
} from "@/lib/metrics";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const { data: products, isLoading } = useProducts();
  const warehouses = products ? computeWarehouseMetrics(products) : [];
  const lowStock = products ? getLowStockAlerts(products) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        subtitle="Per-warehouse stock health and low-inventory alerts"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {isLoading
          ? [...Array(3)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
            ))
          : warehouses.map((w) => {
              const outOfStock = w.stockedSkus < w.totalSkus;
              return (
                <Card key={w.warehouseId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{w.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 font-mono text-sm">
                    <p>
                      ├ {w.stockedSkus}/{w.totalSkus} SKUs stocked
                      {outOfStock ? ` (${w.totalSkus - w.stockedSkus} out of stock)` : ""}
                    </p>
                    <p>├ {w.totalStock} total units</p>
                    <p>├ {w.reserved} reserved</p>
                    <p className="flex items-center gap-2 pt-1">
                      └ Health: {w.healthPercent}%
                      <span
                        className={cn(
                          "inline-block h-2 flex-1 max-w-[120px] overflow-hidden rounded-full bg-muted",
                        )}
                      >
                        <span
                          className={cn("block h-full rounded-full", healthBarColor(w.healthPercent))}
                          style={{ width: `${w.healthPercent}%` }}
                        />
                      </span>
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Low stock alerts</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          All locations with fewer than 5 units available
        </p>
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        ) : lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">No low-stock locations.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Warehouse</th>
                  <th className="px-4 py-3 font-medium">Available</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((row) => (
                  <tr key={`${row.productId}-${row.warehouseId}`} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{row.productName}</td>
                    <td className="px-4 py-3">{row.warehouseName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        {row.available} unit{row.available === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" className="rounded-full" asChild>
                        <Link href="/products">Reserve</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
