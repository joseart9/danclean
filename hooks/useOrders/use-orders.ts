import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { FullOrder } from "@/types/order";

interface UseOrdersOptions {
  searchQuery?: string;
  enabled?: boolean;
  includeDelivered?: boolean;
  limit?: number;
  page?: number;
}

interface FetchOrdersResponse {
  orders: FullOrder[];
  total: number;
}

async function fetchOrders({
  searchQuery,
  includeDelivered,
  limit,
  page = 0,
}: {
  searchQuery?: string;
  includeDelivered?: boolean;
  limit?: number;
  page?: number;
}): Promise<FetchOrdersResponse> {
  const params: Record<string, string> = {};
  if (searchQuery) {
    params.name = searchQuery;
  }
  if (includeDelivered) {
    params.include_delivered = "true";
  }
  if (limit !== undefined) {
    params.limit = limit.toString();
    params.skip = ((page || 0) * limit).toString();
  }
  const config = Object.keys(params).length > 0 ? { params } : {};
  const response = await apiClient.get<FetchOrdersResponse>("/orders", config);
  return response.data;
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const {
    searchQuery = "",
    enabled = true,
    includeDelivered = false,
    limit,
    page = 0,
  } = options;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orders", includeDelivered, searchQuery, limit, page],
    queryFn: () =>
      fetchOrders({
        searchQuery,
        includeDelivered,
        limit,
        page,
      }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });

  const total = data?.total || 0;
  const totalPages = limit ? Math.ceil(total / limit) : 1;

  return {
    orders: data?.orders || [],
    total,
    page: page || 0,
    limit: limit || 10,
    totalPages,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
};
