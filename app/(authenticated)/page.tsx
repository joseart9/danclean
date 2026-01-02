"use client";

import { AdminOnly } from "@/components/auth/admin-only";
import { useDateRange } from "@/providers/date-range-provider";
import {
  StatCard,
  SalesChart,
  PaymentMethodsChart,
  TopCustomers,
  StorageCapacity,
  PendingItems,
  OrdersByTypeChart,
} from "@/components/pages/dashboard";
import { DollarSign, Receipt, CreditCard, TrendingUp } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboard";

export default function Home() {
  const { range } = useDateRange();
  const { data, isLoading } = useDashboardStats(
    range.from,
    range.to || range.from
  );

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Ventas Totales"
            value={data?.totalSales || 0}
            description="Total en el período seleccionado"
            icon={DollarSign}
          />
          <StatCard
            title="Dinero Recibido"
            value={data?.totalReceived || 0}
            description="Total pagado por clientes"
            icon={CreditCard}
          />
          <StatCard
            title="Total de Órdenes"
            value={data?.totalOrders || 0}
            description="Órdenes en el período"
            icon={Receipt}
            isMoney={false}
          />
          <StatCard
            title="Ticket Promedio"
            value={data?.averageOrderValue || 0}
            description="Por orden"
            icon={TrendingUp}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
          <SalesChart fromDate={range.from} toDate={range.to || range.from} />
          <PaymentMethodsChart
            fromDate={range.from}
            toDate={range.to || range.from}
          />
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 md:grid-cols-2">
          <OrdersByTypeChart
            fromDate={range.from}
            toDate={range.to || range.from}
          />
          <StorageCapacity
            fromDate={range.from}
            toDate={range.to || range.from}
          />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 md:grid-cols-2">
          <TopCustomers fromDate={range.from} toDate={range.to || range.from} />
          <PendingItems fromDate={range.from} toDate={range.to || range.from} />
        </div>
      </div>
    </AdminOnly>
  );
}
