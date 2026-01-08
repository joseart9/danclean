"use client";

import { useState } from "react";
import {
  OrderSearchForm,
  OrderDisplay,
  DeliveryCompletionDialog,
} from "@/components/pages/delivery";
import type { FullOrder } from "@/types/order";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { deliveryOrdersColumns } from "@/components/pages/delivery/delivery-orders-table-columns";

export default function DeliveryPage() {
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [multipleOrders, setMultipleOrders] = useState<FullOrder[] | null>(
    null
  );
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);

  const handleOrderFound = (foundOrder: FullOrder) => {
    setOrder(foundOrder);
    setMultipleOrders(null);
  };

  const handleMultipleOrdersFound = (orders: FullOrder[]) => {
    setMultipleOrders(orders);
    setOrder(null);
  };

  const handleDeliveryCompleted = () => {
    setOrder(null);
    setMultipleOrders(null);
    setIsCompletionDialogOpen(false);
  };

  const handleTerminarClick = () => {
    if (order) {
      setIsCompletionDialogOpen(true);
    }
  };

  const handleRowClick = (selectedOrder: FullOrder) => {
    setOrder(selectedOrder);
    setMultipleOrders(null);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 w-full">
        <h1 className="text-2xl font-bold">Entrega de Ordenes</h1>
        <OrderSearchForm
          onOrderFound={handleOrderFound}
          onMultipleOrdersFound={handleMultipleOrdersFound}
        />
      </div>

      {multipleOrders && multipleOrders.length > 1 && (
        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">
              Selecciona la orden a entregar ({multipleOrders.length} órdenes
              encontradas)
            </h2>
            <DataTable
              data={multipleOrders}
              columns={deliveryOrdersColumns}
              enableSearchOnName={false}
              enableExport={false}
              enableColumnResizing={false}
              enableSorting={true}
              enableSortingRemoval={true}
              emptyMessage="No hay órdenes para mostrar"
              onRowClick={handleRowClick}
              isSimpleTable={true}
            />
          </div>
        </div>
      )}

      {order && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleTerminarClick} size="lg">
              Entregar
            </Button>
          </div>
          <OrderDisplay order={order} />
          <div className="flex justify-end">
            <Button onClick={handleTerminarClick} size="lg">
              Entregar
            </Button>
          </div>
          <DeliveryCompletionDialog
            open={isCompletionDialogOpen}
            onOpenChange={setIsCompletionDialogOpen}
            order={order}
            onDeliveryCompleted={handleDeliveryCompleted}
          />
        </div>
      )}
    </div>
  );
}
