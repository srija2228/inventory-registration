"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowRight, Box, LayoutDashboard, Package, Warehouse } from "lucide-react";
import { useSession } from "next-auth/react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, DataTableSkeleton } from "@/components/ui/data-table";
import { StatCard, StatCardSkeleton } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/use-products";
import { useReservations } from "@/hooks/use-reservations";
import { getGreeting } from "@/lib/metrics";
import type { ReservationWithDetails } from "@/types";

function computeStats(
  products: { inventories: { totalStock: number; reservedStock: number }[] }[],
  reservations: ReservationWithDetails[],
) {
  const totalProducts = products.length;
  const totalStock = products.reduce(
    (sum, p) => sum + p.inventories.reduce((s, i) => s + i.totalStock, 0),
    0,
  );
  const activeReservations = reservations.filter((r) => r.status === "PENDING").length;
  const today = new Date().toDateString();
  const releasedToday = reservations.filter(
    (r) => r.status === "RELEASED" && new Date(r.updatedAt).toDateString() === today,
  ).length;

  return { totalProducts, totalStock, activeReservations, releasedToday };
}

const quickActions = [
  {
    href: "/products",
    title: "Browse Products",
    description: "View catalog and reserve stock",
    icon: Package,
  },
  {
    href: "/reservations",
    title: "View All Reservations",
    description: "Track pending and confirmed holds",
    icon: Box,
  },
  {
    href: "/warehouses",
    title: "Warehouse Status",
    description: "Stock levels by location",
    icon: Warehouse,
  },
];

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? "there";

  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErr,
  } = useProducts();
  const {
    data: reservations = [],
    isLoading: reservationsLoading,
    isError: reservationsError,
    error: reservationsErr,
  } = useReservations();

  const loading = productsLoading || reservationsLoading;
  const stats = products ? computeStats(products, reservations) : null;
  const recent = reservations.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{getGreeting(displayName)}</p>
        <PageHeader
          title="Overview"
          subtitle="Your at-a-glance summary and quick navigation"
        />
      </div>

      {(productsError || reservationsError) && (
        <Alert variant="destructive">
          <AlertTitle>Could not load overview data</AlertTitle>
          <AlertDescription className="space-y-1">
            {productsError && (
              <p>
                <strong>GET /api/products</strong> failed:{" "}
                {productsErr instanceof Error ? productsErr.message : "Unknown error"}
              </p>
            )}
            {reservationsError && (
              <p>
                <strong>GET /api/reservations</strong> failed:{" "}
                {reservationsErr instanceof Error ? reservationsErr.message : "Unknown error"}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !stats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total products" value={stats.totalProducts} trend={{ value: "SKUs in catalog", positive: true }} />
            <StatCard label="Total stock units" value={stats.totalStock.toLocaleString()} trend={{ value: "Across warehouses", positive: true }} />
            <StatCard label="Active reservations" value={stats.activeReservations} trend={{ value: "Pending holds", positive: stats.activeReservations < 10 }} />
            <StatCard label="Released today" value={stats.releasedToday} trend={{ value: "Returned to pool", positive: true }} />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center text-sm font-medium text-indigo-600">
                    Open
                    <ArrowRight className="ml-1 size-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent reservations</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                Operations dashboard
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link href="/reservations">
                View all
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {reservationsLoading ? (
          <DataTableSkeleton cols={6} />
        ) : (
          <DataTable
            data={recent}
            keyExtractor={(r) => r.id}
            onRowClick={(r) => router.push(`/reservation/${r.id}`)}
            emptyMessage="No reservations yet — reserve stock from the Products page."
            columns={[
              {
                key: "product",
                header: "Product",
                render: (r) => (
                  <div>
                    <p className="font-medium">{r.product.name}</p>
                    <p className="text-xs text-muted-foreground">{r.product.sku}</p>
                  </div>
                ),
              },
              {
                key: "warehouse",
                header: "Warehouse",
                render: (r) => r.warehouse.name,
              },
              {
                key: "qty",
                header: "Quantity",
                render: (r) => <span className="font-medium">{r.quantity}</span>,
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "expires",
                header: "Expires at",
                render: (r) =>
                  r.status === "PENDING"
                    ? format(new Date(r.expiresAt), "MMM d, HH:mm")
                    : "—",
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                render: (r) => (
                  <Button variant="ghost" size="sm" className="rounded-full" asChild>
                    <Link href={`/reservation/${r.id}`}>Open</Link>
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
