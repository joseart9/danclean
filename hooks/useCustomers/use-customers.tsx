"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { Customer } from "@/types/customer";

interface UseCustomersOptions {
  searchQuery?: string;
  enabled?: boolean;
}

async function fetchCustomers(searchQuery?: string): Promise<Customer[]> {
  const config = searchQuery ? { params: { name: searchQuery } } : {};
  const response = await apiClient.get<Customer[]>("/customers", config);
  return response.data;
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const { searchQuery = "", enabled = true } = options;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["customers", searchQuery],
    queryFn: () => fetchCustomers(searchQuery),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    customers: data || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
