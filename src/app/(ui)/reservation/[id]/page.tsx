"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { CountdownTimer } from "@/components/countdown-timer";
import { ReservationStatusBadge } from "@/components/reservation-status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api-client";
import { formatINR } from "@/lib/format";
import {
  useConfirmReservation,
  useReleaseReservation,
  useReservation,
} from "@/hooks/use-reservation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ReservationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: reservation, isLoading, isError, error, refetch, isFetching } =
    useReservation(id);
  const confirmMutation = useConfirmReservation();
  const releaseMutation = useReleaseReservation();

  const [timerExpired, setTimerExpired] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [releaseSuccess, setReleaseSuccess] = useState(false);
  const [confirmExpiredError, setConfirmExpiredError] = useState(false);

  const isPending = reservation?.status === "PENDING";
  const isConfirmed = reservation?.status === "CONFIRMED" || confirmSuccess;
  const isReleased = reservation?.status === "RELEASED" || releaseSuccess;

  const handleExpired = useCallback(() => {
    setTimerExpired(true);
  }, []);

  useEffect(() => {
    if (!releaseSuccess) return;
    const t = setTimeout(() => router.push("/"), 2000);
    return () => clearTimeout(t);
  }, [releaseSuccess, router]);

  useEffect(() => {
    setTimerExpired(false);
    setConfirmSuccess(false);
    setReleaseSuccess(false);
    setConfirmExpiredError(false);
  }, [id]);

  if (isLoading) {
    return <ReservationDetailSkeleton />;
  }

  if (isError || !reservation) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load reservation</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error instanceof Error ? error.message : "Not found"}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const totalPrice = reservation.product.price * reservation.quantity;
  const expired =
    timerExpired || (isPending && new Date(reservation.expiresAt) <= new Date());

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {isConfirmed ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <AlertTitle>Purchase confirmed!</AlertTitle>
          <AlertDescription>
            Your order has been confirmed. Inventory has been permanently allocated.
          </AlertDescription>
        </Alert>
      ) : null}

      {isReleased ? (
        <Alert>
          <XCircle className="size-4" />
          <AlertTitle>Reservation cancelled</AlertTitle>
          <AlertDescription>
            Stock has been returned. Redirecting to catalog…
          </AlertDescription>
        </Alert>
      ) : null}

      {(expired || confirmExpiredError) && isPending && !isReleased ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Reservation expired</AlertTitle>
          <AlertDescription>
            This hold has expired. Please go back and create a new reservation.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden shadow-lg">
        <div className="relative aspect-[16/9] w-full bg-muted">
          <Image
            src={
              reservation.product.imageUrl ??
              "https://placehold.co/800x450?text=Product"
            }
            alt={reservation.product.name}
            fill
            className="object-cover"
            sizes="512px"
            unoptimized
          />
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl">{reservation.product.name}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {reservation.product.sku}
              </CardDescription>
            </div>
            <ReservationStatusBadge
              status={
                confirmSuccess ? "CONFIRMED" : releaseSuccess ? "RELEASED" : reservation.status
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium text-foreground">{reservation.warehouse.name}</p>
              <p>{reservation.warehouse.location}</p>
            </div>
          </div>

          <Separator />

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Quantity</dt>
              <dd className="text-lg font-semibold">{reservation.quantity}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total</dt>
              <dd className="text-lg font-semibold">{formatINR(totalPrice)}</dd>
            </div>
          </dl>

          {isPending && !isReleased && !confirmSuccess ? (
            <div className="rounded-xl border bg-muted/30 p-4">
              <CountdownTimer
                expiresAt={reservation.expiresAt}
                onExpired={handleExpired}
              />
            </div>
          ) : null}
        </CardContent>

        {isPending && !isReleased && !confirmSuccess ? (
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="w-full sm:flex-1"
              disabled={
                expired ||
                confirmMutation.isPending ||
                releaseMutation.isPending
              }
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
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Confirming…
                </>
              ) : (
                "Confirm purchase"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              disabled={confirmMutation.isPending || releaseMutation.isPending}
              onClick={() => {
                releaseMutation.mutate(id, {
                  onSuccess: () => setReleaseSuccess(true),
                });
              }}
            >
              {releaseMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Cancel reservation"
              )}
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}

function ReservationDetailSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Skeleton className="aspect-[16/9] w-full rounded-xl" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
