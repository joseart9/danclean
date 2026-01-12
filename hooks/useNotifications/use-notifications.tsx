"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export type NotificationType =
  | "ERROR"
  | "INFO"
  | "WARNING"
  | "SUCCESS"
  | "CRITICAL";

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isRead: boolean;
  isDeleted: boolean;
  type: NotificationType;
}

interface UseNotificationsOptions {
  type?: NotificationType;
  enabled?: boolean;
  limit?: number;
  page?: number;
}

interface FetchNotificationsResponse {
  notifications: Notification[];
  total: number;
}

async function fetchNotifications({
  type,
  limit,
  page = 0,
}: {
  type?: NotificationType;
  limit?: number;
  page?: number;
}): Promise<FetchNotificationsResponse> {
  const params: Record<string, string> = {};
  if (limit !== undefined) {
    params.limit = limit.toString();
    params.skip = (page * limit).toString();
  }
  if (type) {
    params.type = type;
  }

  const config = Object.keys(params).length > 0 ? { params } : {};
  const response = await apiClient.get<FetchNotificationsResponse>(
    "/notifications",
    config
  );
  return response.data;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    type,
    enabled = true,
    limit = 20,
    page = 0,
  } = options;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["notifications", type, limit, page],
    queryFn: () =>
      fetchNotifications({
        type,
        limit,
        page,
      }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });

  const total = data?.total || 0;
  const totalPages = limit ? Math.ceil(total / limit) : 1;

  return {
    notifications: data?.notifications || [],
    total,
    page: page || 0,
    limit: limit || 20,
    totalPages,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
