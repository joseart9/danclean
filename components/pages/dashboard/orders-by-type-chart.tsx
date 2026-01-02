"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useDashboardStats } from "@/hooks/useDashboard";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

interface OrdersByTypeChartProps {
  fromDate: Date;
  toDate: Date;
}

export function OrdersByTypeChart({
  fromDate,
  toDate,
}: OrdersByTypeChartProps) {
  const { data, isLoading } = useDashboardStats(fromDate, toDate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Órdenes por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      tipo: "Planchado",
      cantidad: data?.ordersByType.IRONING || 0,
    },
    {
      tipo: "Tintoreria",
      cantidad: data?.ordersByType.CLEANING || 0,
    },
  ];

  const chartConfig = {
    cantidad: {
      label: "Cantidad",
      theme: {
        light: "oklch(0.6231 0.188 259.8145)",
        dark: "oklch(0.7137 0.1434 254.624)",
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Órdenes por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="tipo"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
