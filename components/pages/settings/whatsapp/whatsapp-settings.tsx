"use client";

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

const WHATSAPP_API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || "";

// Helper function to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

// WhatsApp API client with cookie support
const whatsappApiClient = axios.create({
  baseURL: WHATSAPP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies to be sent
});

// Request interceptor to add token from cookie to headers
whatsappApiClient.interceptors.request.use(
  (config) => {
    // Get token from cookie and add to headers
    const token = getCookie("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
whatsappApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors (unauthorized) - token expired or invalid
    if (error.response?.status === 401) {
      // Redirect to login if token is invalid
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

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
  const response = await whatsappApiClient.get<QRResponse>("/connect");
  return response.data;
}

async function fetchHealth(): Promise<HealthResponse> {
  const response = await whatsappApiClient.get<HealthResponse>("/health");
  return response.data;
}

export function WhatsAppSettings() {
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
