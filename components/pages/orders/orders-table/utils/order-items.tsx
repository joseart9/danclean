import { OrderType } from "@/types/order";
import type { FullOrder } from "@/types/order";
import { formatCurrency } from "./formatters";

interface OrderItemsDisplayProps {
  order: FullOrder;
}

export function OrderItemsDisplay({ order }: OrderItemsDisplayProps) {
  const isIroning = order.type === OrderType.IRONING;
  const items = isIroning
    ? order.items
      ? [order.items as { quantity: number; total: number }]
      : []
    : Array.isArray(order.items)
    ? (order.items as Array<{
        item_name: string;
        quantity: number;
        total: number;
      }>)
    : [];

  return (
    <div className="space-y-3">
      {isIroning
        ? items.length > 0 && (
            <div className="flex justify-between items-center p-3 bg-muted rounded-md">
              <div>
                <p className="font-medium">Planchado</p>
                <p className="text-sm text-muted-foreground">
                  {items[0].quantity} piezas
                </p>
              </div>
              <p className="font-medium">{formatCurrency(items[0].total)}</p>
            </div>
          )
        : items.map((item, index) => {
            const cleaningItem = item as {
              item_name: string;
              quantity: number;
              total: number;
            };
            return (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-muted rounded-md"
              >
                <div>
                  <p className="font-medium">{cleaningItem.item_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Cantidad: {cleaningItem.quantity} unidades
                  </p>
                </div>
                <p className="font-medium">
                  {formatCurrency(cleaningItem.total)}
                </p>
              </div>
            );
          })}
    </div>
  );
}
