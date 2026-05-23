import type { ReservationStatus } from "@/types";

import { cn } from "@/lib/utils";

const styles: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200/80",
  CONFIRMED: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
  RELEASED: "bg-gray-100 text-gray-600 ring-gray-200/80",
};

const labels: Record<ReservationStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  RELEASED: "Released",
};

type StatusBadgeProps = {
  status: ReservationStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}

export type StockLevel = "in_stock" | "low_stock" | "out_of_stock";

export function StockStatusBadge({
  level,
  className,
}: {
  level: StockLevel;
  className?: string;
}) {
  const map = {
    in_stock: { label: "In stock", className: "bg-emerald-50 text-emerald-800 ring-emerald-200/80" },
    low_stock: { label: "Low stock", className: "bg-amber-50 text-amber-800 ring-amber-200/80" },
    out_of_stock: { label: "Out of stock", className: "bg-red-50 text-red-700 ring-red-200/80" },
  };
  const cfg = map[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        cfg.className,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}
