"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";

interface CleaningItemOptionFormProps {
  onOptionCreated?: () => void;
}

export function CleaningItemOptionForm({
  onOptionCreated,
}: CleaningItemOptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    toPrice: null as number | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (formData.price <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }

    if (
      formData.toPrice !== null &&
      formData.toPrice !== undefined &&
      formData.toPrice < formData.price
    ) {
      toast.error("El precio máximo debe ser mayor o igual al precio mínimo");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/cleaning-item-options", {
        ...formData,
        toPrice: formData.toPrice || undefined,
      });
      toast.success("Opción de tintoreria creada correctamente");
      setFormData({ name: "", price: 0, toPrice: null });
      onOptionCreated?.();
    } catch (error: unknown) {
      console.error("Error creating cleaning item tintoreria:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al crear la opción de tintoreria");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Field>
          <FieldLabel required>Nombre</FieldLabel>
          <FieldContent>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ej: Vestido, Traje, etc."
              disabled={isSubmitting}
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel required>Precio Mínimo</FieldLabel>
          <FieldContent>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.price || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>Precio Máximo (Opcional)</FieldLabel>
          <FieldContent>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.toPrice || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  toPrice: e.target.value
                    ? parseFloat(e.target.value) || null
                    : null,
                })
              }
              placeholder="Dejar vacío si no aplica"
              disabled={isSubmitting}
            />
          </FieldContent>
        </Field>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full md:w-auto"
      >
        {isSubmitting ? (
          <>
            <Spinner />
            Creando...
          </>
        ) : (
          "Crear Opción de Tintoreria"
        )}
      </Button>
    </form>
  );
}
