"use client";

import { cn } from "@/lib/utils";

export type FilterOption<T extends string> = {
  value: T;
  label: string;
};

type FilterPillsProps<T extends string> = {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterPillsProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-foreground text-background shadow-sm"
              : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
