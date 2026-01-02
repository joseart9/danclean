"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SkeletonDataTable } from "@/components/ui/data-table-skeleton";
import { columns } from "./columns";
import type { FullOrder } from "@/types/order";
import { OrderDetailsDrawer } from "./order-details-drawer";

interface OrdersTableProps {
  orders: FullOrder[];
  isLoading?: boolean;
  onOrdersChange?: () => void;
}

export function OrdersTable({
  orders,
  isLoading,
  onOrdersChange,
}: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<FullOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRowClick = (order: FullOrder) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleOrderUpdated = () => {
    // Trigger refresh of orders list
    onOrdersChange?.();
    // Update selected order if it was the one updated
    setIsDrawerOpen(false);
  };

  if (isLoading) {
    return <SkeletonDataTable columns={8} rows={10} />;
  }

  return (
    <>
      <DataTable
        data={orders}
        columns={columns}
        enableSearchOnName={true}
        emptyMessage="No hay ordenes encontradas"
        enableExport={true}
        exportFilename="ordenes"
        enableColumnResizing={true}
        enableSorting={true}
        enableSortingRemoval={true}
        searchOnNamePlaceholder="Buscar por cliente"
        onRowClick={handleRowClick}
      />
      <OrderDetailsDrawer
        order={selectedOrder}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onOrderUpdated={handleOrderUpdated}
      />
    </>
  );
}
