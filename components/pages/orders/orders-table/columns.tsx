import { ColumnDef } from "@tanstack/react-table";
import type { FullOrder } from "@/types/order";
import { OrderStatus, OrderType } from "@/types/order";
import { translateOrderStatus } from "@/utils/translate-order-status";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
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

export const columns: ColumnDef<FullOrder>[] = [
  {
    accessorKey: "orderNumber",
    header: "# Orden",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.orderNumber}</div>;
    },
  },
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
    id: "customerPhone",
    header: "Telefono",
    accessorFn: (row) => row.customer.phone,
    cell: ({ row }) => {
      return <div>{row.original.customer.phone}</div>;
    },
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
    id: "quantity",
    header: "No. Piezas",
    cell: ({ row }) => {
      const quantity = getItemQuantity(row.original);
      return <div>{quantity}</div>;
    },
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
];
