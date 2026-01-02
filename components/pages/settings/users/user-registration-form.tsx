"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import type { Role } from "@/generated/prisma/browser";

interface UserRegistrationFormProps {
  onUserCreated?: () => void;
}

export function UserRegistrationForm({
  onUserCreated,
}: UserRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    role: "USER" as Role,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient.post("/register", formData);
      toast.success("Usuario creado correctamente");
      // Reset form
      setFormData({
        name: "",
        lastName: "",
        email: "",
        password: "",
        role: "USER",
      });
      onUserCreated?.();
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al crear el usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Registrar Nuevo Usuario</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Nombre</FieldLabel>
            <FieldContent>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre"
                required
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Apellido</FieldLabel>
            <FieldContent>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Apellido"
                required
              />
            </FieldContent>
          </Field>
        </div>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <FieldContent>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="email@ejemplo.com"
              required
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Contraseña</FieldLabel>
          <FieldContent>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Rol</FieldLabel>
          <FieldContent>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as Role })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Usuario</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          <UserPlus className="mr-2 h-4 w-4" />
          {isSubmitting ? "Creando..." : "Crear Usuario"}
        </Button>
      </form>
    </div>
  );
}
