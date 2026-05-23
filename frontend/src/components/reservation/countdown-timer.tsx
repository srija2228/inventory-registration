"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type CountdownTimerProps = {
  expiresAt: string | Date;
  createdAt?: string | Date;
  onExpired?: () => void;
  size?: "default" | "large";
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

export function CountdownTimer({
  expiresAt,
  createdAt,
  onExpired,
  size = "default",
  className,
}: CountdownTimerProps) {
  const expiry = useMemo(
    () => (typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt),
    [expiresAt],
  );
  const start = useMemo(() => {
    if (createdAt) {
      return typeof createdAt === "string" ? new Date(createdAt) : createdAt;
    }
    return new Date(expiry.getTime() - 10 * 60 * 1000);
  }, [createdAt, expiry]);

  const totalMs = Math.max(1, expiry.getTime() - start.getTime());
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(expiry));

  useEffect(() => {
    const tick = () => {
      const next = getRemainingMs(expiry);
      setRemainingMs(next);
      if (next === 0) onExpired?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiry, onExpired]);

  const expired = remainingMs === 0;
  const urgent = !expired && remainingMs < 60_000;
  const large = size === "large";
  const progress = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));

  if (expired) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-red-300 bg-red-50 p-6",
          className,
        )}
      >
        <span
          className={cn(
            "font-semibold text-red-700",
            large ? "text-2xl" : "text-lg",
          )}
        >
          Expired
        </span>
        <p className="mt-1 text-sm text-red-600">This hold is no longer valid</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 bg-card p-6 shadow-sm transition-colors",
        urgent
          ? "animate-pulse border-amber-400 bg-amber-50/80"
          : "border-border",
        className,
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Time remaining
      </span>
      <span
        className={cn(
          "mt-2 font-mono font-bold tabular-nums tracking-tight",
          large ? "text-6xl" : "text-4xl",
          urgent ? "text-amber-700" : "text-foreground",
        )}
      >
        {formatMmSs(remainingMs)}
      </span>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            urgent ? "bg-amber-500" : "bg-indigo-500",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      {urgent ? (
        <p className="mt-3 text-sm font-medium text-amber-800">Confirm before time runs out</p>
      ) : null}
    </div>
  );
}
