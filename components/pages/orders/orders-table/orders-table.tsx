"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SkeletonDataTable } from "@/components/ui/data-table-skeleton";
import { columns } from "./columns";
import type { FullOrder } from "@/types/order";
import { OrderDetailsDrawer } from "./order-details-drawer";
import { Switch } from "@/components/ui/switch";

interface OrdersTableProps {
  orders: FullOrder[];
  isLoading?: boolean;
  onOrdersChange?: () => void;
  includeDelivered?: boolean;
  onIncludeDeliveredChange?: (include: boolean) => void;
}

export function OrdersTable({
  orders,
  isLoading,
  onOrdersChange,
  includeDelivered = false,
  onIncludeDeliveredChange,
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
        sideButtons={
          <>
            {onIncludeDeliveredChange && (
              <Switch
                checked={includeDelivered}
                onChange={(e) => onIncludeDeliveredChange(e.target.checked)}
                label="Incluir Entregados"
              />
            )}
          </>
        }
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
