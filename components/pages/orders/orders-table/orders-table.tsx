"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { createColumns } from "./columns";
import type { FullOrder } from "@/types/order";
import { OrderDetailsDrawer } from "./order-details-drawer";
import { Switch } from "@/components/ui/switch";

interface OrdersTableProps {
  orders: FullOrder[];
  isLoading?: boolean;
  onOrdersChange?: () => void;
  includeDelivered?: boolean;
  onIncludeDeliveredChange?: (include: boolean) => void;
  page?: number;
  total?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSearchChange?: (searchQuery: string) => void;
  searchQuery?: string;
}

export function OrdersTable({
  orders,
  isLoading,
  onOrdersChange,
  includeDelivered = false,
  onIncludeDeliveredChange,
  page = 0,
  total = 0,
  totalPages = 1,
  pageSize = 10,
  onPageChange,
  onSearchChange,
  searchQuery = "",
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

  // Create columns with callback to refresh orders
  const columns = useMemo(
    () => createColumns(() => onOrdersChange?.()),
    [onOrdersChange]
  );

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
        enablePagination={true}
        page={page}
        total={total}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={onPageChange}
        serverSideSearch={true}
        onSearchChange={onSearchChange}
        searchValue={searchQuery}
        isLoading={isLoading}
        rowHeight="lg"
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
