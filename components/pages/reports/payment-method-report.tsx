"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SkeletonDataTable } from "@/components/ui/data-table-skeleton";
import { usePaymentMethodReport } from "@/hooks/useReports";
import { OrderPaymentMethod, OrderType } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import type { PaymentMethodReportOrder } from "@/hooks/useReports/use-payment-method-report";

interface PaymentMethodReportProps {
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

const paymentMethodLabels: Record<OrderPaymentMethod, string> = {
  [OrderPaymentMethod.CASH]: "Efectivo",
  [OrderPaymentMethod.CARD]: "Tarjeta",
  [OrderPaymentMethod.TRANSFER]: "Transferencia",
};

const orderTypeLabels: Record<OrderType, string> = {
  [OrderType.IRONING]: "Planchado",
  [OrderType.CLEANING]: "Tintoreria",
};

interface PaymentMethodReportRow extends PaymentMethodReportOrder {
  paymentMethod: OrderPaymentMethod;
  paymentMethodLabel: string;
}

const columns: ColumnDef<PaymentMethodReportRow>[] = [
  {
    id: "paymentMethod",
    accessorKey: "paymentMethodLabel",
    header: "Método de Pago",
    cell: ({ row }) => {
      return (
        <div className="font-medium uppercase">
          {row.original.paymentMethodLabel}
        </div>
      );
    },
  },
  {
    id: "client",
    accessorKey: "client",
    header: "Cliente",
    cell: ({ row }) => {
      return <div>{row.original.client}</div>;
    },
  },
  {
    id: "orderType",
    accessorKey: "orderType",
    header: "Tipo",
    cell: ({ row }) => {
      return (
        <div className="font-medium uppercase">
          {orderTypeLabels[row.original.orderType]}
        </div>
      );
    },
  },
  {
    id: "orderTotal",
    accessorKey: "orderTotal",
    header: "Total",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {formatCurrency(row.original.orderTotal)}
        </div>
      );
    },
  },
];

export function PaymentMethodReport({
  fromDate,
  toDate,
}: PaymentMethodReportProps) {
  const { data, isLoading } = usePaymentMethodReport(fromDate, toDate);

  // Flatten the data structure for the table
  const tableData = useMemo(() => {
    if (!data) return [];
    return data.flatMap((methodData) =>
      methodData.orders.map((order) => ({
        ...order,
        paymentMethod: methodData.paymentMethod,
        paymentMethodLabel: paymentMethodLabels[methodData.paymentMethod],
      }))
    );
  }, [data]);

  return (
    <DataTable
      data={tableData}
      columns={columns}
      enableExport={true}
      exportFilename="reporte-metodo-pago"
      emptyMessage="No hay datos para el rango de fechas seleccionado"
      isLoading={isLoading}
    />
  );
}
