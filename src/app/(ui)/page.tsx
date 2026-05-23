"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, PackageOpen, RefreshCw } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/product-grid-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api-client";
import { useProducts } from "@/hooks/use-products";
import { useCreateReservation } from "@/hooks/use-reservation";

export default function HomePage() {
  const router = useRouter();
  const { data: products, isLoading, isError, error, refetch, isFetching } =
    useProducts();
  const createReservation = useCreateReservation();
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  const reserveError =
    createReservation.isError && activeProductId
      ? createReservation.error instanceof ApiClientError
        ? createReservation.error.message
        : "Could not create reservation"
      : null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="max-w-2xl text-muted-foreground">
          Reserve inventory across warehouses. Stock updates automatically — no refresh
          needed.
        </p>
      </div>

      {isLoading ? <ProductGridSkeleton /> : null}

      {isError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load products</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error instanceof Error ? error.message : "Something went wrong"}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!isLoading && !isError && products?.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <PackageOpen className="size-10 text-muted-foreground" />
          <p className="text-lg font-medium">No products available</p>
          <p className="text-sm text-muted-foreground">
            Run the database seed to populate the catalog.
          </p>
        </div>
      ) : null}

      {!isLoading && !isError && products && products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isReserving={
                createReservation.isPending && activeProductId === product.id
              }
              reserveError={
                activeProductId === product.id ? reserveError : null
              }
              onReserve={(input) => {
                setActiveProductId(product.id);
                createReservation.mutate(
                  {
                    ...input,
                    idempotencyKey: `ui-${product.id}-${Date.now()}`,
                  },
                  {
                    onSuccess: (reservation) => {
                      setActiveProductId(null);
                      router.push(`/reservation/${reservation.id}`);
                    },
                  },
                );
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
