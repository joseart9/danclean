import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export interface CleaningItemOption {
  id: string;
  name: string;
  price: number;
  toPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
}

async function fetchCleaningItemOptions(): Promise<CleaningItemOption[]> {
  const response = await apiClient.get<CleaningItemOption[]>(
    "/cleaning-item-options"
  );
  return response.data;
}

export function useCleaningItemOptions() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["cleaning-item-options"],
    queryFn: fetchCleaningItemOptions,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    data: data || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
