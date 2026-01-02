"use client";

import { useOrders } from "@/hooks/useOrders";
import { OrdersTable } from "@/components/pages/orders/orders-table";

export default function OrdersPage() {
  const { orders, isLoading, isError, error, refetch } = useOrders();

  if (isError) {
    return (
      <div className="py-6">
        <div className="text-destructive">Error: {error?.message}</div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        onOrdersChange={() => refetch()}
      />
    </div>
  );
}
