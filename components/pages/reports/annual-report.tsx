"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnnualReport } from "@/hooks/useReports";
import { SkeletonDataTable } from "@/components/ui/data-table-skeleton";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function AnnualReport() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Generate years from current year going back 5 years
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const { data, isLoading } = useAnnualReport(selectedYear);

  // Transform data so months are columns
  const tableData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const months = data.map((m) => m.month);

    return {
      months,
      data,
    };
  }, [data]);

  if (isLoading) {
    return <SkeletonDataTable columns={13} rows={4} />;
  }

  if (!tableData) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value, 10))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-center text-muted-foreground py-8">
          No hay datos para el año seleccionado
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value, 10))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccionar año" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10">
                Concepto
              </TableHead>
              {tableData.months.map((month) => (
                <TableHead key={month} className="text-right min-w-[120px]">
                  {month}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium sticky left-0 bg-background z-10">
                Planchado
              </TableCell>
              {tableData.data.map((month) => (
                <TableCell key={month.monthNumber} className="text-right">
                  {formatCurrency(month.ironingIncome)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium sticky left-0 bg-background z-10">
                Lavado
              </TableCell>
              {tableData.data.map((month) => (
                <TableCell key={month.monthNumber} className="text-right">
                  {formatCurrency(month.cleaningIncome)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium sticky left-0 bg-background z-10">
                Gastos
              </TableCell>
              {tableData.data.map((month) => (
                <TableCell key={month.monthNumber} className="text-right">
                  {formatCurrency(month.totalExpenses)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="font-medium bg-muted/50">
              <TableCell className="sticky left-0 bg-muted/50 z-10">
                Total
              </TableCell>
              {tableData.data.map((month) => (
                <TableCell key={month.monthNumber} className="text-right">
                  {formatCurrency(month.total)}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
