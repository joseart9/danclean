"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { Customer } from "@/types/customer";

interface UseCustomersOptions {
  searchQuery?: string;
  enabled?: boolean;
  limit?: number;
}

interface FetchCustomersParams {
  pageParam?: number;
  searchQuery?: string;
  limit?: number;
}

async function fetchCustomers({
  pageParam = 0,
  searchQuery,
  limit = 10,
}: FetchCustomersParams): Promise<Customer[]> {
  const params: Record<string, string> = {
    limit: limit.toString(),
    skip: (pageParam * limit).toString(),
  };

  if (searchQuery) {
    params.name = searchQuery;
  }

  const response = await apiClient.get<Customer[]>("/customers", { params });
  return response.data;
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const { searchQuery = "", enabled = true, limit = 10 } = options;

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["customers", searchQuery, limit],
    queryFn: ({ pageParam = 0 }) =>
      fetchCustomers({ pageParam, searchQuery, limit }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the limit, we've reached the end
      if (lastPage.length < limit) {
        return undefined;
      }
      return allPages.length;
    },
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const customers = data?.pages.flat() || [];

  return {
    customers,
    isLoading,
    isError,
    error: error as Error | null,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  };
}
