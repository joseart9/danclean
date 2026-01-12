"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { NotificationType } from "./use-notifications";

interface UseUnreadCountOptions {
  type?: NotificationType;
  enabled?: boolean;
}

interface UnreadCountResponse {
  count: number;
}

async function fetchUnreadCount(
  type?: NotificationType
): Promise<UnreadCountResponse> {
  const params: Record<string, string> = {
    unread_only: "true",
  };
  if (type) {
    params.type = type;
  }

  const response = await apiClient.get<UnreadCountResponse>(
    "/notifications",
    { params }
  );
  return response.data;
}

export function useUnreadCount(options: UseUnreadCountOptions = {}) {
  const { type, enabled = true } = options;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["notifications", "unread-count", type],
    queryFn: () => fetchUnreadCount(type),
    enabled,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  return {
    count: data?.count || 0,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
