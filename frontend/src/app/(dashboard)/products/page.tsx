"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { useSearch } from "@/components/layout/search-context";
import { ReserveSheet } from "@/components/products/reserve-sheet";
import { ApiClientError } from "@/lib/api-client";
import { formatINR } from "@/lib/format";
import { getStockLevel } from "@/lib/inventory";
import { DataTable, DataTableSkeleton } from "@/components/ui/data-table";
import { FilterPills } from "@/components/ui/filter-pills";
import { StockStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProducts } from "@/hooks/use-products";
import { useCreateReservation } from "@/hooks/use-reservation";
import type { ProductWithStock } from "@/types";

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

function productStockLevel(product: ProductWithStock) {
  const maxAvailable = Math.max(...product.inventories.map((i) => i.availableStock), 0);
  return getStockLevel(maxAvailable);
}

export default function ProductsPage() {
  const router = useRouter();
  const { search } = useSearch();
  const [filter, setFilter] = useState<StockFilter>("all");
  const [selected, setSelected] = useState<ProductWithStock | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: products, isLoading, isError, error, refetch, isFetching } = useProducts();
  const createReservation = useCreateReservation();

  const rows = useMemo(() => {
    if (!products) return [];
    let list = [...products];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.inventories.some((i) => i.warehouse.name.toLowerCase().includes(q)),
      );
    }
    if (filter !== "all") {
      list = list.filter((p) => productStockLevel(p) === filter);
    }
    return list;
  }, [products, search, filter]);

  const reserveError =
    createReservation.isError
      ? createReservation.error instanceof ApiClientError
        ? createReservation.error.message
        : "Reservation failed"
      : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Products" subtitle="Reserve stock from any warehouse" />

      <FilterPills<StockFilter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All" },
          { value: "in_stock", label: "In stock" },
          { value: "low_stock", label: "Low stock" },
          { value: "out_of_stock", label: "Out of stock" },
        ]}
      />

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Failed to load products</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error instanceof Error ? error.message : "Unknown error"}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <DataTableSkeleton cols={5} rows={6} />
      ) : (
        <DataTable
          data={rows}
          keyExtractor={(p) => p.id}
          emptyMessage="No products match your filters."
          columns={[
            {
              key: "product",
              header: "Product",
              render: (p) => (
                <div className="flex items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={p.imageUrl ?? "https://placehold.co/80?text=P"}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "price",
              header: "Price",
              render: (p) => <span className="font-medium">{formatINR(p.price)}</span>,
            },
            {
              key: "warehouses",
              header: "Warehouses",
              render: (p) => (
                <span className="text-sm text-muted-foreground">
                  {p.inventories.filter((i) => i.availableStock > 0).length} with stock
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (p) => <StockStatusBadge level={productStockLevel(p)} />,
            },
            {
              key: "action",
              header: "",
              className: "text-right",
              render: (p) => {
                const canReserve = p.inventories.some((i) => i.availableStock > 0);
                return (
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={!canReserve}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(p);
                      setSheetOpen(true);
                    }}
                  >
                    Reserve
                  </Button>
                );
              },
            },
          ]}
        />
      )}

      <ReserveSheet
        product={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        isPending={createReservation.isPending}
        errorMessage={reserveError}
        onConfirm={(warehouseId, quantity) => {
          if (!selected) return;
          createReservation.mutate(
            {
              productId: selected.id,
              warehouseId,
              quantity,
              idempotencyKey: `ui-${selected.id}-${warehouseId}-${Date.now()}`,
            },
            {
              onSuccess: (res) => {
                setSheetOpen(false);
                toast.success("Reserved! Redirecting to reservation…");
                setTimeout(() => {
                  router.push(`/reservation/${res.id}`);
                }, 1500);
              },
            },
          );
        }}
      />
    </div>
  );
}
