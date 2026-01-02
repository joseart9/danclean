import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { FullOrder } from "@/types/order";

interface UseOrdersOptions {
  searchQuery?: string;
  enabled?: boolean;
  includeDelivered?: boolean;
}

async function fetchOrders(
  searchQuery?: string,
  includeDelivered?: boolean
): Promise<FullOrder[]> {
  const params: Record<string, string> = {};
  if (searchQuery) {
    params.name = searchQuery;
  }
  if (includeDelivered) {
    params.include_delivered = "true";
  }
  const config = Object.keys(params).length > 0 ? { params } : {};
  const response = await apiClient.get<FullOrder[]>("/orders", config);
  return response.data;
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const {
    searchQuery = "",
    enabled = true,
    includeDelivered = false,
  } = options;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orders", includeDelivered],
    queryFn: () => fetchOrders(searchQuery, includeDelivered),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    orders: data || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
};
