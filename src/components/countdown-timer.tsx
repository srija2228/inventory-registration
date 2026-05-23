"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type CountdownTimerProps = {
  expiresAt: string | Date;
  onExpired?: () => void;
  className?: string;
};

function getRemainingMs(expiresAt: Date): number {
  return Math.max(0, expiresAt.getTime() - Date.now());
}

function formatMmSs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function CountdownTimer({ expiresAt, onExpired, className }: CountdownTimerProps) {
  const expiry = useMemo(
    () => (typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt),
    [expiresAt],
  );
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(expiry));

  useEffect(() => {
    const tick = () => {
      const next = getRemainingMs(expiry);
      setRemainingMs(next);
      if (next === 0) {
        onExpired?.();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiry, onExpired]);

  const expired = remainingMs === 0;
  const urgent = !expired && remainingMs < 60_000;

  if (expired) {
    return (
      <p className={cn("text-sm font-semibold text-red-600 dark:text-red-400", className)}>
        Reservation expired
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Time remaining
      </span>
      <span
        className={cn(
          "font-mono text-3xl font-bold tabular-nums tracking-tight",
          urgent ? "text-red-600 dark:text-red-400" : "text-foreground",
        )}
      >
        {formatMmSs(remainingMs)}
      </span>
    </div>
  );
}
