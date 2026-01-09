"use client";

import { DataTable } from "@/components/ui/data-table";
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
  [OrderType.CLEANING]: "Tintoreria",
};

const columns: ColumnDef<OrderReportItem>[] = [
  {
    id: "ticketNumber",
    accessorKey: "ticketNumber",
    header: "Ticket",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.ticketNumber}</div>;
    },
  },
  {
    id: "customer",
    accessorKey: "customerName",
    header: "Cliente",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original.customerName} {row.original.customerLastName}
        </div>
      );
    },
  },
  {
    id: "orderType",
    accessorKey: "orderType",
    header: "Tipo de Orden",
    cell: ({ row }) => {
      return (
        <div className="font-medium uppercase">
          {orderTypeLabels[row.original.orderType]}
        </div>
      );
    },
  },
  {
    id: "paid",
    accessorKey: "paid",
    header: "Pagado",
    cell: ({ row }) => {
      return (
        <div className="font-medium">{formatCurrency(row.original.paid)}</div>
      );
    },
  },
];

export function OrderReport({ fromDate, toDate }: OrderReportProps) {
  const { data, isLoading } = useOrderReport(fromDate, toDate);

  return (
    <DataTable
      data={data || []}
      columns={columns}
      enableExport={true}
      exportFilename="reporte-ordenes"
      emptyMessage="No hay datos para el rango de fechas seleccionado"
      isLoading={isLoading}
    />
  );
}
