"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { User } from "@/types/user";

async function fetchUsers(): Promise<User[]> {
  const response = await apiClient.get<User[]>("/users");
  return response.data;
}

export function useUsers() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    users: data || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
