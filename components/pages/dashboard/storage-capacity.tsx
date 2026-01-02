"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboard";
import { Progress } from "@/components/ui/progress";

interface StorageCapacityProps {
  fromDate: Date;
  toDate: Date;
}

export function StorageCapacity({ fromDate, toDate }: StorageCapacityProps) {
  const { data, isLoading } = useDashboardStats(fromDate, toDate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Capacidad de Almacenamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const storage = data?.storage || {
    totalCapacity: 0,
    usedCapacity: 0,
    freeCapacity: 0,
    usagePercentage: 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacidad de Almacenamiento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Uso</span>
              <span className="text-sm font-medium">
                {storage.usedCapacity} / {storage.totalCapacity} prendas
              </span>
            </div>
            <Progress value={storage.usagePercentage} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Usado</p>
              <p className="text-2xl font-bold">{storage.usedCapacity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disponible</p>
              <p className="text-2xl font-bold text-green-600">
                {storage.freeCapacity}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
