"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  ExpensesTable,
  ExpenseFormDialog,
} from "@/components/pages/expenses/expenses-table";
import { useExpenses } from "@/hooks/useExpenses";
import { useDateRange } from "@/providers/date-range-provider";

export default function ExpensesPage() {
  const { range } = useDateRange();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    data: expenses,
    isLoading,
    refetch,
  } = useExpenses({
    fromDate: range.from,
    toDate: range.to,
  });

  const handleExpensesChange = () => {
    refetch();
  };

  return (
    <div className="py-2">
      <ExpensesTable
        expenses={expenses}
        isLoading={isLoading}
        onExpensesChange={handleExpensesChange}
        sideButtons={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Gasto
          </Button>
        }
      />

      <ExpenseFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onExpenseCreated={handleExpensesChange}
      />
    </div>
  );
}
