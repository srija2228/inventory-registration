"use client";

import { Bell, Search } from "lucide-react";
import { useSession } from "next-auth/react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TopbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  className?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleLabel(role: string) {
  if (role === "admin") return "Operations";
  return "Operator";
}

export function Topbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search products, SKUs, warehouses…",
  className,
}: TopbarProps) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-6 backdrop-blur-md",
        className,
      )}
    >
      <div className="relative mx-auto w-full max-w-xl flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          suppressHydrationWarning
          className="h-10 rounded-full border-border bg-muted/50 pl-10 text-sm shadow-none focus-visible:ring-1"
        />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="relative flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-indigo-500" />
        </button>

        <div className="flex items-center gap-3 rounded-full border border-border bg-card py-1 pl-1 pr-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
            {user ? getInitials(user.name) : "—"}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none text-foreground">
              {user?.name ?? "Guest"}
            </p>
            <p className="text-xs text-muted-foreground">
              {user ? roleLabel(user.role) : "—"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
