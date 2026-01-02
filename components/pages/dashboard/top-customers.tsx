"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboard";

interface TopCustomersProps {
  fromDate: Date;
  toDate: Date;
}

export function TopCustomers({ fromDate, toDate }: TopCustomersProps) {
  // Top customers show all-time data (not filtered by date range)
  const { data, isLoading } = useDashboardStats(fromDate, toDate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topCustomers = data?.topCustomers || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay clientes registrados
            </p>
          ) : (
            topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.orderCount}{" "}
                      {customer.orderCount === 1 ? "orden" : "órdenes"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(customer.total)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
