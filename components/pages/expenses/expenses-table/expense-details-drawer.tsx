"use client";

import { useState, useEffect } from "react";
import type { Expense } from "@/hooks/useExpenses";
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import { EditIcon, TrashIcon, SaveIcon, XIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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

interface ExpenseDetailsDrawerProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseUpdated?: () => void;
}

export function ExpenseDetailsDrawer({
  expense,
  open,
  onOpenChange,
  onExpenseUpdated,
}: ExpenseDetailsDrawerProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
  });

  // Initialize form data when expense changes
  useEffect(() => {
    if (expense) {
      setFormData({
        name: expense.name,
        amount: expense.amount,
      });
      setIsEditing(false);
    }
  }, [expense]);

  if (!expense) return null;

  const handleSave = async () => {
    if (!expense) return;

    setIsSaving(true);
    try {
      await apiClient.put(`/expenses/${expense.id}`, formData);

      toast.success("Gasto actualizado correctamente");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      onExpenseUpdated?.();
    } catch (error: unknown) {
      console.error("Error updating expense:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al actualizar el gasto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (expense) {
      setFormData({
        name: expense.name,
        amount: expense.amount,
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (
      !expense ||
      !confirm("¿Estás seguro de que deseas eliminar este gasto?")
    )
      return;

    try {
      await apiClient.delete(`/expenses/${expense.id}`);
      toast.success("Gasto eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      onOpenChange(false);
      onExpenseUpdated?.();
    } catch (error: unknown) {
      console.error("Error deleting expense:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al eliminar el gasto");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg p-4">
        <div className="flex flex-col gap-6 py-4">
          {/* Información del Gasto */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Información del Gasto</h3>
            <div className="space-y-3">
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Nombre
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nombre del gasto"
                    />
                  ) : (
                    <p className="font-medium">{expense.name}</p>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Monto
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  ) : (
                    <p className="font-medium">
                      {formatCurrency(expense.amount)}
                    </p>
                  )}
                </FieldContent>
              </Field>
            </div>
          </div>

          <Separator />

          {/* Información del Usuario */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Usuario</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">
                  {expense.user.name} {expense.user.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{expense.user.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadatos - Display only */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Metadatos</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  Fecha de Creación
                </p>
                <p className="font-medium">{formatDate(expense.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Última Actualización
                </p>
                <p className="font-medium">{formatDate(expense.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex flex-row gap-2 sm:justify-end mt-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 sm:flex-initial"
              >
                <XIcon className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 sm:flex-initial"
              >
                <SaveIcon className="mr-2 h-4 w-4" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="flex-1 sm:flex-initial"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-initial"
              >
                <EditIcon className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
