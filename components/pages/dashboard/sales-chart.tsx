"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useDashboardStats } from "@/hooks/useDashboard";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

interface SalesChartProps {
  fromDate: Date;
  toDate: Date;
}

export function SalesChart({ fromDate, toDate }: SalesChartProps) {
  const { data, isLoading } = useDashboardStats(fromDate, toDate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventas Diarias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData =
    data?.dailySales.map((item) => {
      // Parse date string (YYYY-MM-DD) as local date, not UTC
      // The date string represents a date in Monterrey timezone
      const [year, month, day] = item.date.split("-").map(Number);
      const localDate = new Date(year, month - 1, day);

      return {
        date: localDate.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        }),
        ventas: item.sales,
        ordenes: item.orders,
      };
    }) || [];

  const chartConfig = {
    ventas: {
      label: "Ventas",
      theme: {
        light: "oklch(0.6231 0.188 259.8145)",
        dark: "oklch(0.7137 0.1434 254.624)",
      },
    },
    ordenes: {
      label: "Órdenes",
      theme: {
        light: "oklch(0.5461 0.2152 262.8809)",
        dark: "oklch(0.6231 0.188 259.8145)",
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Diarias</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="ventas" fill="var(--color-ventas)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
