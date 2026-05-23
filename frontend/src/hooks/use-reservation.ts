"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  ApiClientError,
  confirmReservation,
  createReservation,
  getReservation,
  releaseReservation,
} from "@/lib/api-client";
import type { CreateReservationInput } from "@/types";

export function useReservation(id: string) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => getReservation(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" ? 5_000 : false;
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReservationInput) => createReservation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (error: Error) => {
      if (error instanceof ApiClientError && error.statusCode === 409) {
        toast.error("Not enough stock", {
          description: error.message,
        });
        return;
      }
      toast.error("Could not create reservation", {
        description: error.message,
      });
    },
  });
}

export function useConfirmReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => confirmReservation(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
      void queryClient.invalidateQueries({ queryKey: ["reservation", id] });
    },
    onError: (error: Error) => {
      if (error instanceof ApiClientError && error.statusCode === 410) {
        toast.error("Your reservation has expired", {
          description: "Please return to the catalog and reserve again.",
        });
        return;
      }
      toast.error("Could not confirm purchase", {
        description: error.message,
      });
    },
  });
}

export function useReleaseReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => releaseReservation(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
      void queryClient.invalidateQueries({ queryKey: ["reservation", id] });
    },
    onError: (error: Error) => {
      toast.error("Could not cancel reservation", {
        description: error.message,
      });
    },
  });
}
