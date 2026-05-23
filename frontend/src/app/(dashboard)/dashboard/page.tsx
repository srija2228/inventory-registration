"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableSkeleton } from "@/components/ui/data-table";
import { useProducts } from "@/hooks/use-products";
import { useReservations } from "@/hooks/use-reservations";
import {
  computeWarehouseMetrics,
  countReservationsByStatus,
  getTopLowStockAlerts,
  healthBarColor,
} from "@/lib/metrics";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: products, isLoading: productsLoading, isError: productsError } = useProducts();
  const { data: reservations = [], isLoading: reservationsLoading } = useReservations();

  const loading = productsLoading || reservationsLoading;
  const warehouses = products ? computeWarehouseMetrics(products) : [];
  const lowStockAlerts = products ? getTopLowStockAlerts(products, 3) : [];
  const statusCounts = countReservationsByStatus(reservations);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Operations dashboard"
        subtitle="Inventory health, warehouse breakdown, and reservation activity"
      />

      {productsError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load inventory metrics</AlertTitle>
          <AlertDescription>Check the API connection and database seed.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock level by warehouse</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <DataTableSkeleton cols={6} rows={3} />
              ) : (
                <DataTable
                  data={warehouses}
                  keyExtractor={(w) => w.warehouseId}
                  emptyMessage="No warehouse data."
                  columns={[
                    { key: "name", header: "Warehouse", render: (w) => w.name },
                    {
                      key: "skus",
                      header: "Total SKUs",
                      render: (w) => `${w.stockedSkus}/${w.totalSkus}`,
                    },
                    {
                      key: "total",
                      header: "Total Stock",
                      render: (w) => w.totalStock.toLocaleString(),
                    },
                    {
                      key: "reserved",
                      header: "Reserved",
                      render: (w) => w.reserved.toLocaleString(),
                    },
                    {
                      key: "available",
                      header: "Available",
                      render: (w) => w.available.toLocaleString(),
                    },
                    {
                      key: "health",
                      header: "Health %",
                      render: (w) => (
                        <div className="flex min-w-[100px] items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", healthBarColor(w.healthPercent))}
                              style={{ width: `${w.healthPercent}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium tabular-nums">{w.healthPercent}%</span>
                        </div>
                      ),
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Low stock alerts</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
                ))
              ) : lowStockAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No low-stock alerts right now.</p>
              ) : (
                lowStockAlerts.map((alert) => (
                  <Card
                    key={`${alert.productId}-${alert.warehouseId}`}
                    className="border-amber-200 bg-amber-50/60"
                  >
                    <CardContent className="flex gap-3 p-4">
                      <AlertTriangle className="size-5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-amber-950">
                          {alert.productName}
                        </p>
                        <p className="text-xs text-amber-800">
                          {alert.warehouseName}: only {alert.available} unit
                          {alert.available === 1 ? "" : "s"} left
                        </p>
                        <Button variant="link" className="mt-1 h-auto p-0 text-amber-900" asChild>
                          <Link href="/products">Reserve</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reservation activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{statusCounts.pending}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold text-emerald-600">{statusCounts.confirmed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Released</p>
                  <p className="text-2xl font-bold text-muted-foreground">{statusCounts.released}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {reservationsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              ) : (
                <ol className="relative space-y-0 border-l border-border pl-4">
                  {reservations.slice(0, 8).map((r) => (
                    <li key={r.id} className="mb-6 ml-2">
                      <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full border-2 border-background bg-indigo-500" />
                      <p className="text-sm font-medium">{r.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.quantity}× @ {r.warehouse.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge status={r.status} />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <Button variant="link" className="mt-1 h-auto p-0 text-xs" asChild>
                        <Link href={`/reservation/${r.id}`}>
                          View
                          <ArrowRight className="ml-0.5 size-3" />
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
