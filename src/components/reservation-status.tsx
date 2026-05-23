import type { ReservationStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  CONFIRMED: {
    label: "Confirmed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  },
  RELEASED: {
    label: "Released",
    className: "border-border bg-muted text-muted-foreground",
  },
};

type ReservationStatusBadgeProps = {
  status: ReservationStatus;
  className?: string;
};

export function ReservationStatusBadge({ status, className }: ReservationStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
