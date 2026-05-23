"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format, isThisWeek, isToday } from "date-fns";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, DataTableSkeleton } from "@/components/ui/data-table";
import { FilterPills } from "@/components/ui/filter-pills";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useReservations } from "@/hooks/use-reservations";

type DateFilter = "all" | "today" | "week";

export default function ReportsPage() {
  const router = useRouter();
  const { data: reservations = [], isLoading, isError } = useReservations();
  const [filter, setFilter] = useState<DateFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return reservations;
    return reservations.filter((r) => {
      const created = new Date(r.createdAt);
      if (filter === "today") return isToday(created);
      return isThisWeek(created, { weekStartsOn: 1 });
    });
  }, [reservations, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Reservation history and operational exports"
      />

      <FilterPills<DateFilter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All" },
          { value: "today", label: "Today" },
          { value: "week", label: "This week" },
        ]}
      />

      {isError && (
        <p className="text-sm text-red-600">Failed to load reservation report.</p>
      )}

      {isLoading ? (
        <DataTableSkeleton cols={8} />
      ) : (
        <DataTable
          data={filtered}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => router.push(`/reservation/${r.id}`)}
          emptyMessage="No reservations match this filter."
          columns={[
            {
              key: "id",
              header: "ID",
              render: (r) => (
                <span className="font-mono text-xs">{r.id.slice(0, 8)}…</span>
              ),
            },
            {
              key: "product",
              header: "Product",
              render: (r) => r.product.name,
            },
            {
              key: "warehouse",
              header: "Warehouse",
              render: (r) => r.warehouse.name,
            },
            {
              key: "qty",
              header: "Qty",
              render: (r) => r.quantity,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: "created",
              header: "Created",
              render: (r) => format(new Date(r.createdAt), "MMM d, HH:mm"),
            },
            {
              key: "expires",
              header: "Expires",
              render: (r) =>
                r.status === "PENDING"
                  ? format(new Date(r.expiresAt), "MMM d, HH:mm")
                  : "—",
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (r) => (
                <Button variant="ghost" size="sm" className="rounded-full" asChild>
                  <Link href={`/reservation/${r.id}`}>View</Link>
                </Button>
              ),
            },
          ]}
        />
      )}

      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        CSV export and date-range filters coming in v2
      </p>
    </div>
  );
}
