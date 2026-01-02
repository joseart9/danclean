"use client";

import { useState, useEffect } from "react";
import type { User } from "@/types/user";
import type { Role } from "@/generated/prisma/browser";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "./utils/formatters";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import { EditIcon, TrashIcon, SaveIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserDetailsDrawerProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
}

export function UserDetailsDrawer({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: UserDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    role: "USER" as Role,
  });

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        password: "",
        role: user.role,
      });
      setIsEditing(false);
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Only include password if it's been changed
      const updateData: {
        name?: string;
        lastName?: string;
        email?: string;
        password?: string;
        role?: Role;
      } = {
        name: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
      };

      // Only include password if it's not empty
      if (formData.password) {
        updateData.password = formData.password;
      }

      await apiClient.patch(`/users/${user.id}`, updateData);

      toast.success("Usuario actualizado correctamente");
      setIsEditing(false);
      setFormData({ ...formData, password: "" }); // Clear password field
      onUserUpdated?.();
    } catch (error: unknown) {
      console.error("Error updating user:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al actualizar el usuario");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        password: "",
        role: user.role,
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!user || !confirm("¿Estás seguro de que deseas eliminar este usuario?"))
      return;

    try {
      await apiClient.delete(`/users/${user.id}`);
      toast.success("Usuario eliminado correctamente");
      onOpenChange(false);
      onUserUpdated?.();
    } catch (error: unknown) {
      console.error("Error deleting user:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al eliminar el usuario");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg p-4">
        <div className="flex flex-col gap-6 py-4">
          {/* Información del Usuario */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Información del Usuario</h3>
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
                    <p className="font-medium">{user.name}</p>
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
                    <p className="font-medium">{user.lastName}</p>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Email
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="email@ejemplo.com"
                    />
                  ) : (
                    <p className="font-medium">{user.email}</p>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Contraseña
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Dejar vacío para no cambiar"
                      minLength={8}
                    />
                  ) : (
                    <p className="font-medium text-muted-foreground">
                      ••••••••••
                    </p>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Rol
                </FieldLabel>
                <FieldContent>
                  {isEditing ? (
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value as Role })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Usuario</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role === "ADMIN" ? "Administrador" : "Usuario"}
                    </Badge>
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
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Última Actualización
                </p>
                <p className="font-medium">{formatDate(user.updatedAt)}</p>
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
