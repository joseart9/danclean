"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useDashboardStats } from "@/hooks/useDashboard";
import { Pie, PieChart, Cell } from "recharts";
import { useTheme } from "next-themes";

interface PaymentMethodsChartProps {
  fromDate: Date;
  toDate: Date;
}

const COLORS_LIGHT = [
  "oklch(0.6231 0.188 259.8145)", // chart-1
  "oklch(0.5461 0.2152 262.8809)", // chart-2
  "oklch(0.4882 0.2172 264.3763)", // chart-3
];

const COLORS_DARK = [
  "oklch(0.7137 0.1434 254.624)", // chart-1
  "oklch(0.6231 0.188 259.8145)", // chart-2
  "oklch(0.5461 0.2152 262.8809)", // chart-3
];

export function PaymentMethodsChart({
  fromDate,
  toDate,
}: PaymentMethodsChartProps) {
  const { data, isLoading } = useDashboardStats(fromDate, toDate);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
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
      name: "Efectivo",
      value: data?.paymentMethods.CASH || 0,
    },
    {
      name: "Tarjeta",
      value: data?.paymentMethods.CARD || 0,
    },
    {
      name: "Transferencia",
      value: data?.paymentMethods.TRANSFER || 0,
    },
  ].filter((item) => item.value > 0);

  const chartConfig = {
    value: {
      label: "Monto",
    },
  };

  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <PieChart>
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0];
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium">
                            {data.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency: "COP",
                              minimumFractionDigits: 0,
                            }).format(data.value as number)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
