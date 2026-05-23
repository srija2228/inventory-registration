import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StockBadgeProps = {
  available: number;
  className?: string;
};

export function StockBadge({ available, className }: StockBadgeProps) {
  if (available <= 0) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
          className,
        )}
      >
        Out of stock
      </Badge>
    );
  }

  if (available <= 5) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
          className,
        )}
      >
        {available} left
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
        className,
      )}
    >
      {available} available
    </Badge>
  );
}
