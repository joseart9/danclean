"use client";

import { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentDate } from "@/utils/get-current-date";
import { es } from "react-day-picker/locale";

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
  const [date, setDate] = useState<Date>(getCurrentDate("America/Mexico_City"));
  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({ name: "", amount: 0 });
      setDate(getCurrentDate("America/Mexico_City"));
    }
  }, [open]);

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
      await apiClient.post("/expenses", {
        ...formData,
        timestamp: date,
      });
      toast.success("Gasto creado correctamente");
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar Gasto</DialogTitle>
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

            <Field>
              <FieldLabel>Fecha</FieldLabel>
              <FieldContent>
                <div className="bg-card rounded-lg p-4 w-full">
                  <Calendar
                    mode="single"
                    onSelect={(value: Date | undefined) => {
                      if (value != null) {
                        setDate(value);
                      }
                    }}
                    selected={date}
                    timeZone="America/Mexico_City"
                    className="capitalize"
                    locale={es}
                  />
                </div>
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
