import { ColumnDef } from "@tanstack/react-table";
import { CleaningItemOption } from "@/hooks/useCleaningItemOptions";

export const columns: ColumnDef<CleaningItemOption>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.name}</div>;
    },
  },
  {
    accessorKey: "price",
    header: "Precio",
    cell: ({ row }) => {
      const { price, toPrice } = row.original;
      const formatPrice = (value: number) =>
        new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          minimumFractionDigits: 0,
        }).format(value);

      return (
        <div>
          {toPrice
            ? `${formatPrice(price)} - ${formatPrice(toPrice)}`
            : formatPrice(price)}
        </div>
      );
    },
  },
];
