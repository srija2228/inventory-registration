"use client";

import { MapPin, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { getWarehouses } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProducts } from "@/hooks/use-products";

export default function WarehousesPage() {
  const { data: warehouses, isLoading, isError } = useQuery({
    queryKey: ["warehouses"],
    queryFn: getWarehouses,
  });
  const { data: products } = useProducts();

  const stockByWarehouse = new Map<string, { total: number; available: number }>();
  products?.forEach((p) => {
    p.inventories.forEach((inv) => {
      const cur = stockByWarehouse.get(inv.warehouseId) ?? { total: 0, available: 0 };
      stockByWarehouse.set(inv.warehouseId, {
        total: cur.total + inv.totalStock,
        available: cur.available + inv.availableStock,
      });
    });
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses"
        subtitle="Fulfillment centers and on-hand inventory totals"
      />

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load warehouses</AlertTitle>
          <AlertDescription>Verify the API server is running.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))
          : warehouses?.map((w) => {
              const stats = stockByWarehouse.get(w.id) ?? { total: 0, available: 0 };
              return (
                <div
                  key={w.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Package className="size-5" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{w.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {w.location}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total units</p>
                      <p className="text-lg font-bold">{stats.total}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className="text-lg font-bold text-emerald-600">{stats.available}</p>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
