"use client";

import Image from "next/image";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";

import { ReserveModal } from "@/components/reserve-modal";
import { StockBadge } from "@/components/stock-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/format";
import type { ProductWithStock } from "@/types";

type ProductCardProps = {
  product: ProductWithStock;
  onReserve: (input: {
    productId: string;
    warehouseId: string;
    quantity: number;
  }) => void;
  isReserving?: boolean;
  reserveError?: string | null;
};

export function ProductCard({
  product,
  onReserve,
  isReserving = false,
  reserveError,
}: ProductCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const totalAvailable = product.inventories.reduce(
    (sum, inv) => sum + inv.availableStock,
    0,
  );
  const canReserve = totalAvailable > 0;

  return (
    <>
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image
            src={product.imageUrl ?? "https://placehold.co/600x450?text=Product"}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
            unoptimized
          />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-2 text-lg leading-snug">{product.name}</CardTitle>
          <CardDescription className="font-mono text-xs">{product.sku}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 pb-2">
          <p className="text-2xl font-bold tracking-tight">{formatINR(product.price)}</p>
          {product.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          ) : null}
          <Separator />
          <ul className="space-y-2">
            {product.inventories.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate text-muted-foreground">{inv.warehouse.name}</span>
                <StockBadge available={inv.availableStock} />
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            className="w-full"
            disabled={!canReserve}
            onClick={() => setModalOpen(true)}
          >
            <ShoppingBag className="size-4" />
            {canReserve ? "Reserve" : "Out of stock"}
          </Button>
        </CardFooter>
      </Card>

      <ReserveModal
        product={product}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onConfirm={(input) => onReserve(input)}
        isPending={isReserving}
        errorMessage={reserveError}
      />
    </>
  );
}
