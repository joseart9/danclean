"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrderTypeReport } from "@/hooks/useReports";
import { OrderPaymentMethod, OrderType } from "@/types/order";
import { formatDate } from "@/components/pages/orders/orders-table/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrderTypeReportItem } from "@/hooks/useReports/use-order-type-report";

interface OrderTypeReportProps {
  fromDate: Date;
  toDate: Date;
}

type TypeFilter = OrderType | "ALL";

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

const paymentMethodLabels: Record<OrderPaymentMethod, string> = {
  [OrderPaymentMethod.CASH]: "Efectivo",
  [OrderPaymentMethod.CARD]: "Tarjeta",
  [OrderPaymentMethod.TRANSFER]: "Transferencia",
};

export function OrderTypeReport({ fromDate, toDate }: OrderTypeReportProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  const { data, isLoading } = useOrderTypeReport(
    fromDate,
    toDate,
    typeFilter === "ALL" ? undefined : typeFilter
  );

  const { totalPaid, totalOrderAmount } = useMemo(() => {
    const rows = data || [];
    return rows.reduce(
      (acc, item) => {
        acc.totalPaid += item.paid;
        acc.totalOrderAmount += item.total;
        return acc;
      },
      { totalPaid: 0, totalOrderAmount: 0 }
    );
  }, [data]);

  const columns: ColumnDef<OrderTypeReportItem>[] = [
    {
      id: "date",
      accessorFn: (row) => formatDate(row.timestamp),
      header: "Fecha",
      cell: ({ row }) => (
        <div className="font-medium">{formatDate(row.original.timestamp)}</div>
      ),
      footer: () => <div className="font-bold">Total</div>,
    },
    {
      id: "ticketNumber",
      accessorKey: "ticketNumber",
      header: " # Nota",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.ticketNumber}</div>
      ),
      footer: () => null,
    },
    {
      id: "customer",
      accessorFn: (row) => `${row.customerName} ${row.customerLastName}`,
      header: "Cliente",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.customerName} {row.original.customerLastName}
        </div>
      ),
      footer: () => null,
    },
    {
      id: "orderType",
      accessorFn: (row) => orderTypeExportLabels[row.orderType],
      header: "Tipo",
      cell: ({ row }) => (
        <div className="font-medium uppercase">
          {orderTypeLabels[row.original.orderType]}
        </div>
      ),
      footer: () => null,
    },
    {
      id: "paymentMethod",
      accessorFn: (row) => paymentMethodLabels[row.paymentMethod],
      header: "Método de Pago",
      cell: ({ row }) => (
        <div className="font-medium uppercase">
          {paymentMethodLabels[row.original.paymentMethod]}
        </div>
      ),
      footer: () => null,
    },
    {
      id: "paid",
      accessorKey: "paid",
      header: "Pagado",
      cell: ({ row }) => (
        <div className="font-medium">{formatCurrency(row.original.paid)}</div>
      ),
      footer: () => (
        <div className="font-bold">{formatCurrency(totalPaid)}</div>
      ),
    },
    {
      id: "total",
      accessorKey: "total",
      header: "Total Orden",
      cell: ({ row }) => (
        <div className="font-medium">{formatCurrency(row.original.total)}</div>
      ),
      footer: () => (
        <div className="font-bold">{formatCurrency(totalOrderAmount)}</div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Tipo de Orden:
        </span>
        <Select
          value={typeFilter}
          onValueChange={(value: TypeFilter) => setTypeFilter(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value={OrderType.IRONING}>Planchado</SelectItem>
            <SelectItem value={OrderType.CLEANING}>Tintoreria</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        data={data || []}
        columns={columns}
        enableExport={true}
        exportFilename="reporte-por-tipo"
        emptyMessage="No hay datos para el rango de fechas seleccionado"
        isLoading={isLoading}
      />
    </div>
  );
}
