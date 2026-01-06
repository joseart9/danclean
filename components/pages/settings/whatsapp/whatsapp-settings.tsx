"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import axios from "axios";

const WHATSAPP_API_URL = "http://localhost:4000";

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

async function fetchQRCode(): Promise<QRResponse> {
  const response = await axios.get<QRResponse>(`${WHATSAPP_API_URL}/connect`);
  return response.data;
}

async function fetchHealth(): Promise<HealthResponse> {
  const response = await axios.get<HealthResponse>(
    `${WHATSAPP_API_URL}/health`
  );
  return response.data;
}

export function WhatsAppSettings() {
  const isDevelopment = useMemo(
    () =>
      process.env.NODE_ENV === "development" ||
      (typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1")),
    []
  );

  // Fetch QR code (development only)
  const {
    data: qrData,
    isLoading: isLoadingQR,
    isError: isErrorQR,
    error: errorQR,
    refetch: refetchQR,
  } = useQuery({
    queryKey: ["whatsapp-qr"],
    queryFn: fetchQRCode,
    enabled: isDevelopment,
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
          )}
        </CardContent>
      </Card>

      {isDevelopment && (
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
      )}

      {!isDevelopment && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración de WhatsApp</CardTitle>
            <CardDescription>
              La configuración de código QR solo está disponible en modo
              desarrollo
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
