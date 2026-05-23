"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";

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

type ReserveSheetProps = {
  product: ProductWithStock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (warehouseId: string, quantity: number) => void;
  isPending?: boolean;
  errorMessage?: string | null;
};

export function ReserveSheet({
  product,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  errorMessage,
}: ReserveSheetProps) {
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const warehouseOptions = useMemo(() => {
    if (!product) return [];
    return [...product.inventories].sort((a, b) =>
      a.warehouse.name.localeCompare(b.warehouse.name),
    );
  }, [product]);

  const selectedInv = warehouseOptions.find((i) => i.warehouseId === warehouseId);
  const maxQty = selectedInv?.availableStock ?? 0;

  useEffect(() => {
    if (!open || !product) return;
    const firstAvailable = warehouseOptions.find((i) => i.availableStock > 0);
    setWarehouseId(firstAvailable?.warehouseId ?? warehouseOptions[0]?.warehouseId ?? "");
    setQuantity(1);
  }, [open, product?.id, warehouseOptions]);

  useEffect(() => {
    if (quantity > maxQty && maxQty > 0) setQuantity(maxQty);
  }, [maxQty, quantity]);

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-border bg-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Reserve stock</SheetTitle>
          <SheetDescription>
            Choose a warehouse and quantity. Reservation holds for 10 minutes.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex gap-4 rounded-2xl border border-border bg-muted/30 p-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image
                src={product.imageUrl ?? "https://placehold.co/120?text=P"}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <p className="font-semibold">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.sku}</p>
              <p className="mt-1 text-sm font-medium">{formatINR(product.price)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse">Warehouse</Label>
            <select
              id="warehouse"
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                setQuantity(1);
              }}
              className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {warehouseOptions.map((inv) => (
                <option
                  key={inv.warehouseId}
                  value={inv.warehouseId}
                  disabled={inv.availableStock < 1}
                >
                  {inv.warehouse.name} — {inv.availableStock} available
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={isPending || maxQty < 1}
              suppressHydrationWarning
              className="rounded-xl"
            />
            {maxQty > 0 && (
              <p className="text-xs text-muted-foreground">
                Up to {maxQty} unit{maxQty === 1 ? "" : "s"} available at this warehouse
              </p>
            )}
          </div>

          {errorMessage ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="border-t border-border pt-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">
                {quantity} × {formatINR(product.price)}
              </span>
              <span className="text-lg font-bold">{formatINR(product.price * quantity)}</span>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Reservation holds for 10 minutes
            </p>
            <Button
              className="w-full rounded-xl bg-[#1a1d23] hover:bg-[#252830]"
              size="lg"
              disabled={maxQty < 1 || quantity < 1 || !warehouseId || isPending}
              onClick={() => onConfirm(warehouseId, quantity)}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Reserving…
                </>
              ) : (
                "Reserve Stock"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
