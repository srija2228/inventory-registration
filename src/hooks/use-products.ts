"use client";

import { useQuery } from "@tanstack/react-query";

import { getProducts } from "@/lib/api-client";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    staleTime: 30_000,
  });
}
