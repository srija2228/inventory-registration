"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, DataTableSkeleton } from "@/components/ui/data-table";
import { FilterPills } from "@/components/ui/filter-pills";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useReservations } from "@/hooks/use-reservations";
import type { ReservationStatus } from "@/types";
import { useMemo, useState } from "react";

type StatusFilter = "all" | ReservationStatus;

export default function ReservationsPage() {
  const router = useRouter();
  const { data: reservations = [], isLoading, isError } = useReservations();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return reservations;
    return reservations.filter((r) => r.status === filter);
  }, [reservations, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservations"
        subtitle="Active holds, confirmations, and releases"
        actions={
          <Button className="rounded-full" asChild title="Browse products to reserve stock">
            <Link href="/products">New reservation</Link>
          </Button>
        }
      />

      <FilterPills<StatusFilter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All" },
          { value: "PENDING", label: "Pending" },
          { value: "CONFIRMED", label: "Confirmed" },
          { value: "RELEASED", label: "Released" },
        ]}
      />

      {isError && (
        <p className="text-sm text-red-600">Failed to load reservations.</p>
      )}

      {isLoading ? (
        <DataTableSkeleton cols={6} />
      ) : (
        <DataTable
          data={filtered}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => router.push(`/reservation/${r.id}`)}
          emptyMessage="No reservations in this view."
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
            { key: "warehouse", header: "Warehouse", render: (r) => r.warehouse.name },
            { key: "qty", header: "Qty", render: (r) => r.quantity },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              key: "expires",
              header: "Expires",
              render: (r) =>
                r.status === "PENDING"
                  ? format(new Date(r.expiresAt), "MMM d, HH:mm")
                  : "—",
            },
            {
              key: "action",
              header: "",
              className: "text-right",
              render: (r) => (
                <Button variant="ghost" size="sm" className="rounded-full" asChild>
                  <Link href={`/reservation/${r.id}`}>Details</Link>
                </Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
