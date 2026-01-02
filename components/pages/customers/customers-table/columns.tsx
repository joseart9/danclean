import { ColumnDef } from "@tanstack/react-table";
import type { Customer } from "@/types/customer";

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const columns: ColumnDef<Customer>[] = [
  {
    id: "name",
    header: "Nombre",
    accessorFn: (row) => `${row.name} ${row.lastName}`,
    cell: ({ row }) => {
      const customer = row.original;
      const fullName = `${customer.name} ${customer.lastName}`;
      return <div className="font-medium">{fullName}</div>;
    },
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => {
      return <div>{row.original.phone}</div>;
    },
  },
  {
    accessorKey: "address",
    header: "Dirección",
    cell: ({ row }) => {
      return <div>{row.original.address || "-"}</div>;
    },
  },
];
