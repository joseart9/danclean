import { ColumnDef } from "@tanstack/react-table";
import type { Expense } from "@/hooks/useExpenses";

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const columns: ColumnDef<Expense>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.name}</div>;
    },
  },
  {
    accessorKey: "amount",
    header: "Monto",
    cell: ({ row }) => {
      return <div>{formatCurrency(row.original.amount)}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Fecha",
    cell: ({ row }) => {
      return <div>{formatDate(row.original.createdAt)}</div>;
    },
  },
  {
    accessorKey: "user",
    header: "Usuario",
    accessorFn: (row) => `${row.user.name} ${row.user.lastName}`,
    cell: ({ row }) => {
      return (
        <div>
          {row.original.user.name} {row.original.user.lastName}
        </div>
      );
    },
  },
];
