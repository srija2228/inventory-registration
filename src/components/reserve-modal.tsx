"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { StockBadge } from "@/components/stock-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatINR } from "@/lib/format";
import type { ProductWithStock } from "@/types";

type ReserveModalProps = {
  product: ProductWithStock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: {
    productId: string;
    warehouseId: string;
    quantity: number;
  }) => void;
  isPending?: boolean;
  errorMessage?: string | null;
};

export function ReserveModal({
  product,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  errorMessage,
}: ReserveModalProps) {
  const inStock = useMemo(
    () => product?.inventories.filter((inv) => inv.availableStock > 0) ?? [],
    [product],
  );

  const [warehouseId, setWarehouseId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const selected = inStock.find((inv) => inv.warehouseId === warehouseId);
  const maxQty = selected?.availableStock ?? 1;

  useEffect(() => {
    if (!open || !product) return;
    const first = inStock[0];
    setWarehouseId(first?.warehouseId ?? "");
    setQuantity(1);
  }, [open, product, inStock]);

  useEffect(() => {
    if (quantity > maxQty) {
      setQuantity(maxQty);
    }
  }, [maxQty, quantity]);

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Reserve {product.name}</SheetTitle>
          <SheetDescription>
            Select a warehouse and quantity. Stock is held for a limited time.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-1 flex-col gap-6">
          <div className="space-y-3">
            <Label>Warehouse</Label>
            <div className="space-y-2">
              {inStock.map((inv) => (
                <button
                  key={inv.warehouseId}
                  type="button"
                  onClick={() => setWarehouseId(inv.warehouseId)}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                    warehouseId === inv.warehouseId
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <p className="font-medium">{inv.warehouse.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.warehouse.location}</p>
                  </div>
                  <StockBadge available={inv.availableStock} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={!warehouseId || isPending}
            />
            <p className="text-xs text-muted-foreground">
              Max {maxQty} unit{maxQty !== 1 ? "s" : ""} at this warehouse
            </p>
          </div>

          {errorMessage ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-auto space-y-3 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Unit price</span>
              <span className="font-medium">{formatINR(product.price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated total</span>
              <span className="text-lg font-semibold">
                {formatINR(product.price * quantity)}
              </span>
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={!warehouseId || quantity < 1 || isPending}
              onClick={() =>
                onConfirm({
                  productId: product.id,
                  warehouseId,
                  quantity,
                })
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Reserving…
                </>
              ) : (
                "Confirm reservation"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
