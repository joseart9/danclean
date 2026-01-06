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
import {
  DollarSign,
  Receipt,
  CreditCard,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <StatCard
            title="Ingreso Bruto"
            value={data?.totalSales || 0}
            icon={DollarSign}
          />
          <StatCard
            title="Ingreso Neto"
            value={data?.totalReceived || 0}
            description="Ingreso neto (descontando el 50% de tintoreria)"
            icon={CreditCard}
          />
          <StatCard
            title="Efectivo en Caja"
            value={data?.cashOnHand || 0}
            description="No considera el deposito inicial"
            icon={Wallet}
          />
          <StatCard
            title="Total de Órdenes"
            value={data?.totalOrders || 0}
            icon={Receipt}
            isMoney={false}
          />
          <StatCard
            title="Ticket Promedio"
            value={data?.averageOrderValue || 0}
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
