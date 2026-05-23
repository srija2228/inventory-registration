import { cn } from "@/lib/utils";

type StockBarProps = {
  total: number;
  reserved: number;
  className?: string;
};

export function StockBar({ total, reserved, className }: StockBarProps) {
  const safeTotal = Math.max(total, 1);
  const usedPct = Math.min(100, Math.round((reserved / safeTotal) * 100));
  const availablePct = 100 - usedPct;

  const barColor =
    availablePct === 0
      ? "bg-red-500"
      : availablePct <= 30
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className={cn("w-full min-w-[80px]", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${availablePct}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {total - reserved} / {total} free
      </p>
    </div>
  );
}
