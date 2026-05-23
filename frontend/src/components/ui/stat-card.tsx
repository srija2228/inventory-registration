import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type StatCardProps = {
  label: string;
  value: string | number;
  trend?: { value: string; positive?: boolean };
  className?: string;
};

export function StatCard({ label, value, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {trend ? (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            trend.positive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600",
          )}
        >
          {trend.positive ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {trend.value}
        </div>
      ) : null}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Skeleton className="h-9 w-20" />
      <Skeleton className="mt-2 h-4 w-28" />
      <Skeleton className="mt-3 h-5 w-16 rounded-full" />
    </div>
  );
}
