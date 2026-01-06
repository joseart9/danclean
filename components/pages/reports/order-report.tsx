"use client";

import { DataTable } from "@/components/ui/data-table";
import { SkeletonDataTable } from "@/components/ui/data-table-skeleton";
import { useOrderReport } from "@/hooks/useReports";
import { OrderType } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrderReportItem } from "@/hooks/useReports/use-order-report";

interface OrderReportProps {
  fromDate: Date;
  toDate: Date;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const orderTypeLabels: Record<OrderType, string> = {
  [OrderType.IRONING]: "Planchado",
  [OrderType.CLEANING]: "Lavado",
};

const columns: ColumnDef<OrderReportItem>[] = [
  {
    id: "client",
    accessorKey: "client",
    header: "Cliente",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.client}</div>;
    },
  },
  {
    id: "orderType",
    accessorKey: "orderType",
    header: "Tipo de Orden",
    cell: ({ row }) => {
      return (
        <Badge variant="outline">
          {orderTypeLabels[row.original.orderType]}
        </Badge>
      );
    },
  },
  {
    id: "quantity",
    accessorKey: "quantity",
    header: "Cantidad",
    cell: ({ row }) => {
      return <div className="text-right">{row.original.quantity}</div>;
    },
  },
  {
    id: "orderTotal",
    accessorKey: "orderTotal",
    header: "Total",
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {formatCurrency(row.original.orderTotal)}
        </div>
      );
    },
  },
];

export function OrderReport({ fromDate, toDate }: OrderReportProps) {
  const { data, isLoading } = useOrderReport(fromDate, toDate);

  if (isLoading) {
    return <SkeletonDataTable columns={4} rows={10} />;
  }

  return (
    <DataTable
      data={data || []}
      columns={columns}
      enableExport={true}
      exportFilename="reporte-ordenes"
      emptyMessage="No hay datos para el rango de fechas seleccionado"
    />
  );
}
