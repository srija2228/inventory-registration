"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import confetti from "canvas-confetti";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  XCircle,
} from "lucide-react";

import { CountdownTimer } from "@/components/reservation/countdown-timer";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api-client";
import { formatINR } from "@/lib/format";
import {
  useConfirmReservation,
  useReleaseReservation,
  useReservation,
} from "@/hooks/use-reservation";

type PageProps = { params: Promise<{ id: string }> };

function fireConfetti() {
  void confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 },
  });
}

export default function ReservationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: reservation, isLoading, isError, error, refetch } = useReservation(id);
  const confirmMutation = useConfirmReservation();
  const releaseMutation = useReleaseReservation();

  const [timerExpired, setTimerExpired] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [releaseSuccess, setReleaseSuccess] = useState(false);
  const [confirmExpiredError, setConfirmExpiredError] = useState(false);

  const isPending = reservation?.status === "PENDING";
  const isReleased = reservation?.status === "RELEASED" || releaseSuccess;
  const expired =
    timerExpired ||
    (isPending && reservation && new Date(reservation.expiresAt) <= new Date());

  const handleExpired = useCallback(() => setTimerExpired(true), []);

  useEffect(() => {
    if (confirmSuccess) fireConfetti();
  }, [confirmSuccess]);

  useEffect(() => {
    if (!releaseSuccess) return;
    const t = setTimeout(() => router.push("/products"), 2500);
    return () => clearTimeout(t);
  }, [releaseSuccess, router]);

  useEffect(() => {
    setTimerExpired(false);
    setConfirmSuccess(false);
    setReleaseSuccess(false);
    setConfirmExpiredError(false);
  }, [id]);

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError || !reservation) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Reservation not found</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Unknown error"}
          <Button variant="link" className="ml-2 h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const total = reservation.product.price * reservation.quantity;
  const showActions = isPending && !isReleased && !confirmSuccess;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" className="rounded-full" asChild>
          <Link href="/reservations">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>

      <PageHeader
        title={reservation.product.name}
        subtitle={`Reservation ${reservation.id.slice(0, 8)}…`}
        actions={
          <StatusBadge
            status={confirmSuccess ? "CONFIRMED" : releaseSuccess ? "RELEASED" : reservation.status}
          />
        }
      />

      {confirmSuccess && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <AlertTitle className="text-emerald-900">Purchase confirmed!</AlertTitle>
          <AlertDescription className="text-emerald-800">
            Inventory has been permanently allocated.
          </AlertDescription>
        </Alert>
      )}

      {releaseSuccess && (
        <Alert>
          <XCircle className="size-4" />
          <AlertTitle>Reservation cancelled</AlertTitle>
          <AlertDescription>Stock returned. Redirecting to products…</AlertDescription>
        </Alert>
      )}

      {(expired || confirmExpiredError) && isPending && !isReleased && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Reservation expired</AlertTitle>
          <AlertDescription>
            Create a new reservation from the products catalog.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative aspect-[21/9] bg-muted">
              <Image
                src={reservation.product.imageUrl ?? "https://placehold.co/800x340?text=Product"}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-6">
              <p className="font-mono text-xs text-muted-foreground">{reservation.product.sku}</p>
              <p className="mt-2 text-sm text-muted-foreground">{reservation.product.description}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Reservation details</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Warehouse</dt>
                <dd className="mt-1 flex items-center gap-1 font-medium">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  {reservation.warehouse.name}
                </dd>
                <dd className="text-sm text-muted-foreground">{reservation.warehouse.location}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Quantity</dt>
                <dd className="mt-1 text-2xl font-bold">{reservation.quantity}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Unit price</dt>
                <dd className="mt-1 font-medium">{formatINR(reservation.product.price)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Total</dt>
                <dd className="mt-1 text-2xl font-bold">{formatINR(total)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="mt-1 text-sm">
                  {format(new Date(reservation.createdAt), "MMM d, yyyy HH:mm")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Expires</dt>
                <dd className="mt-1 text-sm">
                  {format(new Date(reservation.expiresAt), "MMM d, yyyy HH:mm")}
                </dd>
              </div>
            </dl>
          </div>

          {showActions && (
            <div className="space-y-3">
              <Button
                className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                size="lg"
                disabled={expired || confirmMutation.isPending || releaseMutation.isPending}
                onClick={() => {
                  setConfirmExpiredError(false);
                  confirmMutation.mutate(id, {
                    onSuccess: () => setConfirmSuccess(true),
                    onError: (err) => {
                      if (err instanceof ApiClientError && err.statusCode === 410) {
                        setConfirmExpiredError(true);
                      }
                    },
                  });
                }}
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Confirm Purchase"
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                size="lg"
                disabled={confirmMutation.isPending || releaseMutation.isPending}
                onClick={() => {
                  releaseMutation.mutate(id, { onSuccess: () => setReleaseSuccess(true) });
                }}
              >
                {releaseMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Cancel Reservation"
                )}
              </Button>
            </div>
          )}

          {(confirmSuccess || releaseSuccess) && (
            <Button variant="outline" className="w-full rounded-xl" asChild>
              <Link href="/products">Back to products</Link>
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {showActions ? (
            <CountdownTimer
              expiresAt={reservation.expiresAt}
              createdAt={reservation.createdAt}
              onExpired={handleExpired}
              size="large"
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-3 flex justify-center">
                <StatusBadge
                  status={
                    confirmSuccess ? "CONFIRMED" : releaseSuccess ? "RELEASED" : reservation.status
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
