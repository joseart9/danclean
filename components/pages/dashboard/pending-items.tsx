"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboard";
import { Shirt, Sparkles } from "lucide-react";

interface PendingItemsProps {
  fromDate: Date;
  toDate: Date;
}

export function PendingItems({ fromDate, toDate }: PendingItemsProps) {
  const { data, isLoading } = useDashboardStats(fromDate, toDate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingItems = data?.pendingItems || {
    ironing: 0,
    cleaning: 0,
    total: 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-2">
                <Shirt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Planchado</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
            <p className="text-2xl font-bold">{pendingItems.ironing}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Tintoreria</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
            <p className="text-2xl font-bold">{pendingItems.cleaning}</p>
          </div>
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Total</p>
              <p className="text-2xl font-bold">{pendingItems.total}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
