"use client";

import { DataTable } from "@/components/ui/data-table";
import { useOrderReport } from "@/hooks/useReports";
import { OrderType } from "@/types/order";
import { formatDate } from "@/components/pages/orders/orders-table/utils/formatters";
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

const orderTypeExportLabels: Record<OrderType, string> = {
  [OrderType.IRONING]: "PLANCHA",
  [OrderType.CLEANING]: "TINTORERIA",
};

export function OrderReport({ fromDate, toDate }: OrderReportProps) {
  const { data, isLoading } = useOrderReport(fromDate, toDate);

  const totalPaid = (data || []).reduce((sum, item) => sum + item.paid, 0);

  const columnsWithFooter: ColumnDef<OrderReportItem>[] = [
    {
      id: "date",
      accessorFn: (row) => formatDate(row.timestamp),
      header: "Fecha",
      cell: ({ row }) => {
        return (
          <div className="font-medium">{formatDate(row.original.timestamp)}</div>
        );
      },
      footer: () => <div className="font-bold">Total</div>,
    },
    {
      id: "ticketNumber",
      accessorKey: "ticketNumber",
      header: " # Nota",
      cell: ({ row }) => {
        return <div className="font-medium">{row.original.ticketNumber}</div>;
      },
      footer: () => null,
    },
    {
      id: "customer",
      accessorFn: (row) => `${row.customerName} ${row.customerLastName}`,
      header: "Cliente",
      cell: ({ row }) => {
        return (
          <div className="font-medium">
            {row.original.customerName} {row.original.customerLastName}
          </div>
        );
      },
      footer: () => null,
    },
    {
      id: "orderType",
      accessorFn: (row) => orderTypeExportLabels[row.orderType],
      header: "Tipo de Orden",
      cell: ({ row }) => {
        return (
          <div className="font-medium uppercase">
            {orderTypeLabels[row.original.orderType]}
          </div>
        );
      },
      footer: () => null,
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
      footer: () => (
        <div className="font-bold">{formatCurrency(totalPaid)}</div>
      ),
    },
  ];

  return (
    <DataTable
      data={data || []}
      columns={columnsWithFooter}
      enableExport={true}
      exportFilename="reporte-ordenes"
      emptyMessage="No hay datos para el rango de fechas seleccionado"
      isLoading={isLoading}
    />
  );
}
