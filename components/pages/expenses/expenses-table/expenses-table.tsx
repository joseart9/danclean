"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SkeletonDataTable } from "@/components/ui/data-table-skeleton";
import { columns } from "./columns";
import type { Expense } from "@/hooks/useExpenses";
import { ExpenseDetailsDrawer } from "./expense-details-drawer";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpensesTableProps {
  expenses: Expense[];
  isLoading: boolean;
  onExpensesChange?: () => void;
  sideButtons?: React.ReactNode;
}

export function ExpensesTable({
  expenses,
  isLoading,
  onExpensesChange,
  sideButtons,
}: ExpensesTableProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRowClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDrawerOpen(true);
  };

  const handleExpenseUpdated = () => {
    // Trigger refresh of expenses list
    onExpensesChange?.();
    // Close drawer
    setIsDrawerOpen(false);
  };

  if (isLoading) {
    return <SkeletonDataTable columns={4} rows={10} />;
  }

  return (
    <>
      <DataTable
        data={expenses}
        columns={columns}
        enableSearchOnName={true}
        emptyMessage="No hay gastos encontrados"
        enableExport={true}
        exportFilename="gastos"
        enableColumnResizing={true}
        enableSorting={true}
        enableSortingRemoval={true}
        searchOnNamePlaceholder="Buscar por nombre"
        onRowClick={handleRowClick}
        sideButtons={sideButtons}
      />
      <ExpenseDetailsDrawer
        expense={selectedExpense}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onExpenseUpdated={handleExpenseUpdated}
      />
    </>
  );
}
