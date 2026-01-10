"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { FullOrder } from "@/types/order";
import { OrderStatus, OrderType } from "@/types/order";
import { translateOrderStatus } from "@/utils/translate-order-status";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";

// Extend ColumnDef to include defaultHidden property
type ExtendedColumnDef<TData> = ColumnDef<TData> & {
  defaultHidden?: boolean;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getItemQuantity = (order: FullOrder): number => {
  if (order.type === OrderType.IRONING) {
    // For IRONING, items is a single IroningItem object
    const item = order.items as { quantity: number } | null;
    return item?.quantity ?? 0;
  } else {
    // For CLEANING, items is an array of CleaningItem
    const items = order.items as Array<{ quantity: number }> | null;
    if (Array.isArray(items)) {
      return items.reduce((sum, item) => sum + item.quantity, 0);
    }
    return 0;
  }
};

// Component for the Complete Order action button
function CompleteOrderButton({
  order,
  onOrderUpdated,
}: {
  order: FullOrder;
  onOrderUpdated?: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleCompleteOrder = async () => {
    if (order.status === OrderStatus.COMPLETED) {
      toast.info("La orden ya está completada");
      return;
    }

    if (order.status === OrderStatus.DELIVERED) {
      toast.error("No se puede completar una orden ya entregada");
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.patch(`/orders/${order.id}`, {
        status: OrderStatus.COMPLETED,
        timestamp: order.timestamp,
      });

      toast.success("Orden marcada como completada");

      // Invalidate queries to refresh the orders list
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // Call callback to refresh
      onOrderUpdated?.();
    } catch (error: unknown) {
      console.error("Error completing order:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al completar la orden");
    } finally {
      setIsUpdating(false);
    }
  };

  // Don't show button if order is already completed or delivered
  if (
    order.status === OrderStatus.COMPLETED ||
    order.status === OrderStatus.DELIVERED
  ) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation(); // Prevent row click
        handleCompleteOrder();
      }}
      disabled={isUpdating}
      className="gap-2"
    >
      {isUpdating ? (
        <>
          <Spinner className="h-4 w-4" />
          <span>Completando...</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4" />
          <span>Completar</span>
        </>
      )}
    </Button>
  );
}

export const createColumns = (
  onOrderUpdated?: () => void
): ExtendedColumnDef<FullOrder>[] => [
  {
    id: "name",
    header: "Cliente",
    accessorFn: (row) => `${row.customer.name} ${row.customer.lastName}`,
    cell: ({ row }) => {
      const customer = row.original.customer;
      const fullName = `${customer.name} ${customer.lastName}`;
      return <div>{fullName}</div>;
    },
  },
  {
    accessorKey: "type",
    header: "Servicio",
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <div className="capitalize">
          {type === OrderType.IRONING ? "PLANCHA" : "TINTORERIA"}
        </div>
      );
    },
  },
  {
    accessorKey: "ticketNumber",
    header: "# Nota",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.ticketNumber}</div>;
    },
  },
  {
    accessorKey: "orderNumber",
    header: "# Orden",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.orderNumber}</div>;
    },
    defaultHidden: true,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      return (
        <div className="font-medium">{formatCurrency(row.original.total)}</div>
      );
    },
  },
  {
    accessorKey: "totalPaid",
    header: "Pagado",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {formatCurrency(row.original.totalPaid)}
        </div>
      );
    },
  },
  {
    id: "quantity",
    header: "No. Piezas",
    cell: ({ row }) => {
      const quantity = getItemQuantity(row.original);
      return <div>{quantity}</div>;
    },
    defaultHidden: true,
  },
  {
    accessorKey: "status",
    header: "Estatus",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant={
            status === OrderStatus.DELIVERED
              ? "success"
              : status === OrderStatus.COMPLETED
              ? "warning"
              : status === OrderStatus.CANCELLED ||
                status === OrderStatus.DAMAGED ||
                status === OrderStatus.LOST ||
                status === OrderStatus.PENDING
              ? "destructive"
              : "secondary"
          }
        >
          {translateOrderStatus(status)}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      return (
        <CompleteOrderButton
          order={row.original}
          onOrderUpdated={onOrderUpdated}
        />
      );
    },
  },
];

// Export default columns for backward compatibility
export const columns = createColumns();
