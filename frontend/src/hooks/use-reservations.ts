"use client";

import { useQuery } from "@tanstack/react-query";

import { getReservations } from "@/lib/api-client";

export function useReservations() {
  return useQuery({
    queryKey: ["reservations"],
    queryFn: getReservations,
    staleTime: 15_000,
    retry: 1,
  });
}
