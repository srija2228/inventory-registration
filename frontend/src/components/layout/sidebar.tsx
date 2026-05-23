"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  Box,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Package,
  Settings,
  Warehouse,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/warehouses", label: "Warehouses", icon: Warehouse },
  { href: "/reservations", label: "Reservations", icon: Box },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const bottomNav = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: HelpCircle },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
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

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-[var(--sidebar-border)] px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/90 text-sm font-bold text-white">
          A
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Allo Inventory</p>
            <p className="truncate text-xs text-[var(--sidebar-foreground)]/60">
              Reservation OS
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--sidebar-accent)] text-white"
                  : "text-[var(--sidebar-foreground)]/75 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        <Separator className="my-3 bg-[var(--sidebar-border)]" />

        {bottomNav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--sidebar-accent)] text-white"
                  : "text-[var(--sidebar-foreground)]/75 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-[var(--sidebar-border)] p-3">
        {user && !collapsed && (
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
              {getInitials(user.name ?? "U")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-[var(--sidebar-foreground)]/60">
                {roleLabel(user.role)}
              </p>
            </div>
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full justify-start text-[var(--sidebar-foreground)]/80 hover:bg-white/5 hover:text-white"
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span className="ml-2">Log out</span>}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center text-[var(--sidebar-foreground)]/80 hover:bg-white/5 hover:text-white"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
