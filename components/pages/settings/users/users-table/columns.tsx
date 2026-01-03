import { ColumnDef } from "@tanstack/react-table";
import type { User } from "@/types/user";
import { Badge } from "@/components/ui/badge";

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const columns: ColumnDef<User>[] = [
  {
    id: "name",
    header: "Nombre",
    accessorFn: (row) => `${row.name} ${row.lastName}`,
    cell: ({ row }) => {
      const user = row.original;
      const fullName = `${user.name} ${user.lastName}`;
      return <div className="font-medium">{fullName}</div>;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return <div>{row.original.email}</div>;
    },
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
      const role = row.original.role;
      return (
        <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
          {role === "ADMIN" ? "Administrador" : "Usuario"}
        </Badge>
      );
    },
  },
];
