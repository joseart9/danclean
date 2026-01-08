"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { Customer } from "@/types/customer";

interface UseCustomersOptions {
  searchQuery?: string;
  enabled?: boolean;
  limit?: number;
  page?: number;
}

interface FetchCustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function fetchCustomers({
  page = 0,
  searchQuery,
  limit = 10,
}: {
  page?: number;
  searchQuery?: string;
  limit?: number;
}): Promise<FetchCustomersResponse> {
  const params: Record<string, string> = {
    limit: limit.toString(),
    skip: (page * limit).toString(),
  };

  if (searchQuery) {
    params.name = searchQuery;
  }

  const response = await apiClient.get<{
    customers: Customer[];
    total: number;
  }>("/customers", { params });
  const { customers, total } = response.data;
  const totalPages = Math.ceil(total / limit);

  return {
    data: customers,
    total,
    page,
    limit,
    totalPages,
  };
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const { searchQuery = "", enabled = true, limit = 10, page = 0 } = options;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["customers", searchQuery, limit, page],
    queryFn: () => fetchCustomers({ page, searchQuery, limit }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    customers: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 0,
    limit: data?.limit || limit,
    totalPages: data?.totalPages || 1,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
