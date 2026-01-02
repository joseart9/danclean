"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { User } from "@/generated/prisma/client";

interface UseMeResponse {
  data: User | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

async function fetchMe(): Promise<User> {
  const response = await apiClient.get<User>("/me");
  return response.data;
}

export function useMe(): UseMeResponse {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
