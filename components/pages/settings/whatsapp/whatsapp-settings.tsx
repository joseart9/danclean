"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";

interface QRResponse {
  status: string;
  qr: string;
  message: string;
}

interface HealthResponse {
  status: string;
  whatsapp: {
    ready: boolean;
    authenticated: boolean;
    hasQr: boolean;
  };
  timestamp: string;
}

interface LogoutResponse {
  status: string;
  message: string;
}

async function fetchQRCode(): Promise<QRResponse> {
  const response = await apiClient.get<QRResponse>("/whatsapp/connect");
  return response.data;
}

async function fetchHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>("/whatsapp/health");
  return response.data;
}

export function WhatsAppSettings() {
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch QR code
  const {
    data: qrData,
    isLoading: isLoadingQR,
    isError: isErrorQR,
    error: errorQR,
    refetch: refetchQR,
  } = useQuery({
    queryKey: ["whatsapp-qr"],
    queryFn: fetchQRCode,
    refetchInterval: (query) => {
      // If QR is ready, stop polling. Otherwise, poll every 5 seconds
      const data = query.state.data;
      return data?.status === "qr_ready" ? false : 5000;
    },
  });

  // Fetch health status
  const {
    data: healthData,
    isLoading: isLoadingHealth,
    isError: isErrorHealth,
    error: errorHealth,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ["whatsapp-health"],
    queryFn: fetchHealth,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const isConnected =
    healthData?.whatsapp?.ready === true &&
    healthData?.whatsapp?.authenticated === true;

  const handleLogout = async () => {
    if (!isConnected) {
      toast.error("No hay sesión activa para cerrar");
      return;
    }

    setIsLoggingOut(true);
    try {
      const response = await apiClient.post<LogoutResponse>("/whatsapp/logout");
      toast.success(response.data.message || "Sesión cerrada correctamente");

      // Invalidate queries to refresh the status
      queryClient.invalidateQueries({ queryKey: ["whatsapp-health"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-qr"] });

      // Refetch to get updated status
      await Promise.all([refetchHealth(), refetchQR()]);
    } catch (error: unknown) {
      console.error("Error logging out:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al cerrar sesión de WhatsApp");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estado de WhatsApp</CardTitle>
          <CardDescription>
            Verifica el estado de la conexión de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingHealth ? (
            <div className="flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              <span>Verificando estado...</span>
            </div>
          ) : isErrorHealth ? (
            <div className="space-y-2">
              <div className="text-destructive">
                Error al verificar el estado:{" "}
                {errorHealth instanceof Error
                  ? errorHealth.message
                  : "Error desconocido"}
              </div>
              <button
                onClick={() => refetchHealth()}
                className="text-sm text-primary hover:underline"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Conectado" : "Desconectado"}
                </Badge>
                <button
                  onClick={() => refetchHealth()}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Actualizar
                </button>
              </div>
              {isConnected && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Cerrando...
                    </>
                  ) : (
                    "Cerrar Sesión"
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Código QR de Conexión</CardTitle>
          <CardDescription>
            Escanea este código QR con WhatsApp para conectar la sesión
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingQR ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : isErrorQR ? (
            <div className="space-y-2">
              <div className="text-destructive">
                Error al obtener el código QR:{" "}
                {errorQR instanceof Error
                  ? errorQR.message
                  : "Error desconocido"}
              </div>
              <button
                onClick={() => refetchQR()}
                className="text-sm text-primary hover:underline"
              >
                Reintentar
              </button>
            </div>
          ) : qrData?.qr ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={qrData.qr}
                  alt="WhatsApp QR Code"
                  className="max-w-xs rounded-lg border"
                />
              </div>
              {qrData.message && (
                <p className="text-center text-sm text-muted-foreground">
                  {qrData.message}
                </p>
              )}
              <div className="flex justify-center">
                <button
                  onClick={() => refetchQR()}
                  className="text-sm text-primary hover:underline"
                >
                  Actualizar código QR
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No hay código QR disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
