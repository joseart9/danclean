"use client";

import { useState } from "react";
import {
  OrderSearchForm,
  OrderDisplay,
  DeliveryCompletionDialog,
} from "@/components/pages/delivery";
import type { FullOrder } from "@/types/order";
import { Button } from "@/components/ui/button";

export default function DeliveryPage() {
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);

  const handleOrderFound = (foundOrder: FullOrder) => {
    setOrder(foundOrder);
  };

  const handleDeliveryCompleted = () => {
    setOrder(null);
    setIsCompletionDialogOpen(false);
  };

  const handleTerminarClick = () => {
    if (order) {
      setIsCompletionDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 w-full">
        <h1 className="text-2xl font-bold">Entrega de Ordenes</h1>
        <OrderSearchForm onOrderFound={handleOrderFound} />
      </div>

      {order && (
        <div className="space-y-4">
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
