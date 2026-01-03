"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import type { CleaningItemOption } from "@/hooks/useCleaningItemOptions";
import { EditIcon, TrashIcon, SaveIcon, XIcon } from "lucide-react";

interface CleaningItemOptionDetailsDrawerProps {
  option: CleaningItemOption | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptionUpdated?: () => void;
}

export function CleaningItemOptionDetailsDrawer({
  option,
  open,
  onOpenChange,
  onOptionUpdated,
}: CleaningItemOptionDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    toPrice: null as number | null,
  });

  // Initialize form data when option changes
  useEffect(() => {
    if (option) {
      setFormData({
        name: option.name,
        price: option.price,
        toPrice: option.toPrice,
      });
      setIsEditing(false);
    }
  }, [option]);

  if (!option) return null;

  const handleSave = async () => {
    if (!option) return;

    setIsSaving(true);
    try {
      await apiClient.patch(`/cleaning-item-options/${option.id}`, {
        ...formData,
        toPrice: formData.toPrice || undefined,
      });

      toast.success("Opción de limpieza actualizada correctamente");
      setIsEditing(false);
      onOptionUpdated?.();
    } catch (error: unknown) {
      console.error("Error updating cleaning item option:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al actualizar la opción de limpieza");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (option) {
      setFormData({
        name: option.name,
        price: option.price,
        toPrice: option.toPrice,
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (
      !option ||
      !confirm("¿Estás seguro de que deseas eliminar esta opción de limpieza?")
    )
      return;

    try {
      await apiClient.delete(`/cleaning-item-options/${option.id}`);
      toast.success("Opción de limpieza eliminada correctamente");
      onOpenChange(false);
      onOptionUpdated?.();
    } catch (error: unknown) {
      console.error("Error deleting cleaning item option:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al eliminar la opción de limpieza");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg p-4">
        <div className="flex flex-col gap-6 py-4">
          {/* Información de la Opción */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Información de la Opción</h3>
            <div className="space-y-3">
              <Field>
                <FieldLabel required className="text-sm text-muted-foreground">
                  Nombre
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nombre de la opción"
                    />
                  ) : (
                    <p className="font-medium">{option.name}</p>
                  )}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel required className="text-sm text-muted-foreground">
                  Precio Mínimo
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                  ) : (
                    <p className="font-medium">
                      {new Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                        minimumFractionDigits: 0,
                      }).format(option.price)}
                    </p>
                  )}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Precio Máximo (Opcional)
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
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
                    />
                  ) : (
                    <p className="font-medium">
                      {option.toPrice
                        ? new Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                            minimumFractionDigits: 0,
                          }).format(option.toPrice)
                        : "No aplica"}
                    </p>
                  )}
                </FieldContent>
              </Field>
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
