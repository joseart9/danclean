import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { FullOrder } from "@/types/order";

interface UseOrdersOptions {
  searchQuery?: string;
  enabled?: boolean;
}

async function fetchOrders(searchQuery?: string): Promise<FullOrder[]> {
  const config = searchQuery ? { params: { name: searchQuery } } : {};
  const response = await apiClient.get<FullOrder[]>("/orders", config);
  console.log(response.data);
  return response.data;
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const { searchQuery = "", enabled = true } = options;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(searchQuery),
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
