"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/axios";

interface HealthResponse {
  status: string;
  whatsapp: {
    ready: boolean;
    authenticated: boolean;
    hasQr: boolean;
  };
  timestamp: string;
}

async function fetchHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>("/whatsapp/health");
  return response.data;
}

export function WhatsAppStatusBadge() {
  const {
    data: healthData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["whatsapp-health"],
    queryFn: fetchHealth,
    refetchInterval: 30000, // Poll every 30 seconds
    retry: 1, // Only retry once on failure
  });

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1.5">
        <Spinner className="h-3 w-3" />
        <span>WhatsApp</span>
      </Badge>
    );
  }

  if (isError) {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <span className="h-2 w-2 rounded-full bg-current" />
        <span>WhatsApp</span>
      </Badge>
    );
  }

  const isConnected =
    healthData?.whatsapp?.ready === true &&
    healthData?.whatsapp?.authenticated === true;

  return (
    <Badge
      variant={isConnected ? "success" : "destructive"}
      className="gap-1.5"
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      <span>WhatsApp</span>
    </Badge>
  );
}
