"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseCreated?: () => void;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  onExpenseCreated,
}: ExpenseFormDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (formData.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/expenses", formData);
      toast.success("Gasto creado correctamente");
      setFormData({ name: "", amount: 0 });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      onOpenChange(false);
      onExpenseCreated?.();
    } catch (error: unknown) {
      console.error("Error creating expense:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al crear el gasto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Gasto</DialogTitle>
          <DialogDescription>
            Ingresa la información del nuevo gasto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Field>
              <FieldLabel required>Nombre</FieldLabel>
              <FieldContent>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Materiales, Servicios, etc."
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel required>Monto</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </FieldContent>
            </Field>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner />
                  Creando...
                </>
              ) : (
                "Crear Gasto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
