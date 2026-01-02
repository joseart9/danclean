"use client";

import { useState, useEffect } from "react";
import type { Customer } from "@/types/customer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { formatDate } from "./utils/formatters";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import { EditIcon, TrashIcon, SaveIcon, XIcon } from "lucide-react";

interface CustomerDetailsDrawerProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerUpdated?: () => void;
}

export function CustomerDetailsDrawer({
  customer,
  open,
  onOpenChange,
  onCustomerUpdated,
}: CustomerDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  // Initialize form data when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        lastName: customer.lastName,
        phone: customer.phone,
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        zip: customer.zip || "",
        country: customer.country || "",
      });
      setIsEditing(false);
    }
  }, [customer]);

  if (!customer) return null;

  const handleSave = async () => {
    if (!customer) return;

    setIsSaving(true);
    try {
      await apiClient.patch(`/customers/${customer.id}`, formData);

      toast.success("Cliente actualizado correctamente");
      setIsEditing(false);
      onCustomerUpdated?.();
    } catch (error: unknown) {
      console.error("Error updating customer:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al actualizar el cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (customer) {
      setFormData({
        name: customer.name,
        lastName: customer.lastName,
        phone: customer.phone,
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        zip: customer.zip || "",
        country: customer.country || "",
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (
      !customer ||
      !confirm("¿Estás seguro de que deseas eliminar este cliente?")
    )
      return;

    try {
      await apiClient.delete(`/customers/${customer.id}`);
      toast.success("Cliente eliminado correctamente");
      onOpenChange(false);
      onCustomerUpdated?.();
    } catch (error: unknown) {
      console.error("Error deleting customer:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al eliminar el cliente");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg p-4">
        <div className="flex flex-col gap-6 py-4">
          {/* Información del Cliente */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Información del Cliente</h3>
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
                      placeholder="Nombre"
                    />
                  ) : (
                    <p className="font-medium">{customer.name}</p>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Apellido
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Apellido"
                    />
                  ) : (
                    <p className="font-medium">{customer.lastName}</p>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Teléfono
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Teléfono"
                    />
                  ) : (
                    <p className="font-medium">{customer.phone}</p>
                  )}
                </FieldContent>
              </Field>
            </div>
          </div>

          <Separator />

          {/* Dirección */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Dirección</h3>
            <div className="space-y-3">
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Dirección
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Dirección"
                    />
                  ) : (
                    <p className="font-medium">{customer.address || "-"}</p>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Ciudad
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="Ciudad"
                    />
                  ) : (
                    <p className="font-medium">{customer.city || "-"}</p>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Estado
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      placeholder="Estado"
                    />
                  ) : (
                    <p className="font-medium">{customer.state || "-"}</p>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Código Postal
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      value={formData.zip}
                      onChange={(e) =>
                        setFormData({ ...formData, zip: e.target.value })
                      }
                      placeholder="Código Postal"
                    />
                  ) : (
                    <p className="font-medium">{customer.zip || "-"}</p>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  País
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      placeholder="País"
                    />
                  ) : (
                    <p className="font-medium">{customer.country || "-"}</p>
                  )}
                </FieldContent>
              </Field>
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
                <p className="font-medium">{formatDate(customer.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Última Actualización
                </p>
                <p className="font-medium">{formatDate(customer.updatedAt)}</p>
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
