"use client";

import type { OrderWithUser, FullOrder } from "@/types/order";
import { formatDate } from "./formatters";
import { translateOrderStatus } from "@/utils/translate-order-status";
import { paymentMethodLabels, paymentStatusLabels } from "./labels";
import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/types/order";
import { formatCurrency } from "./formatters";

interface OrderHistoryTimelineProps {
  orderHistory: OrderWithUser[];
  currentOrder: FullOrder;
}

export function OrderHistoryTimeline({
  orderHistory,
  currentOrder,
}: OrderHistoryTimelineProps) {
  // Combine current order with history, sorted by createdAt (newest first)
  const allOrders = [
    currentOrder,
    ...orderHistory.filter((h) => h.id !== currentOrder.id),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      {allOrders.map((order, index) => {
        const isCurrent = order.id === currentOrder.id;
        const isLast = index === allOrders.length - 1;

        return (
          <div key={order.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border" />
            )}

            {/* Timeline dot */}
            <div
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                isCurrent
                  ? "border-primary bg-primary"
                  : "border-muted-foreground bg-background"
              }`}
            >
              {isCurrent && (
                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2 pb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {isCurrent ? "Versión Actual" : "Versión Anterior"}
                    </p>
                    {isCurrent && (
                      <Badge variant="default" className="text-xs">
                        Actual
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Estatus</p>
                    <Badge
                      variant={
                        order.status === OrderStatus.DELIVERED
                          ? "success"
                          : order.status === OrderStatus.COMPLETED
                          ? "warning"
                          : order.status === OrderStatus.CANCELLED ||
                            order.status === OrderStatus.DAMAGED ||
                            order.status === OrderStatus.LOST ||
                            order.status === OrderStatus.PENDING
                          ? "destructive"
                          : "secondary"
                      }
                      className="mt-1"
                    >
                      {translateOrderStatus(order.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estado de Pago</p>
                    <p className="font-medium">
                      {paymentStatusLabels[order.paymentStatus]}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Método de Pago</p>
                    <p className="font-medium">
                      {paymentMethodLabels[order.paymentMethod]}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Pagado</p>
                    <p className="font-medium">
                      {formatCurrency(order.totalPaid)}
                    </p>
                  </div>
                </div>

                {order.user && (
                  <div className="mt-3 border-t pt-2">
                    <p className="text-xs text-muted-foreground">
                      Actualizado por
                    </p>
                    <p className="text-sm font-medium">
                      {order.user.name} {order.user.lastName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
