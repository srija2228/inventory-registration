"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  className?: string;
};

export function SiteHeader({ className }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const showBack = pathname.startsWith("/reservation/");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        {showBack ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Go back"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="size-4" />
          </Button>
        ) : (
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Package className="size-4" aria-hidden />
          </div>
        )}
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Allo
        </Link>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Inventory Reservation
        </span>
      </div>
    </header>
  );
}
