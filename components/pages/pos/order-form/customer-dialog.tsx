"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  createCustomerSchema,
  type CreateCustomerInput,
} from "@/validators/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import type { Customer } from "@/types/customer";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: Customer) => void;
}

export function CustomerDialog({
  open,
  onOpenChange,
  onCustomerCreated,
}: CustomerDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerInput>();

  const onSubmit = async (data: CreateCustomerInput) => {
    // Validate with Zod
    const validationResult = createCustomerSchema.safeParse(data);
    if (!validationResult.success) {
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateCustomerInput;
        setError(field, {
          type: "manual",
          message: issue.message,
        });
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<Customer>(
        "/customers",
        validationResult.data
      );

      toast.success("Cliente creado exitosamente");
      onCustomerCreated(response.data);
      reset();
      onOpenChange(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error creating customer:", error);

      if (error.response?.data?.error) {
        const errorData = error.response.data.error;

        // Handle Zod validation errors from server
        if (typeof errorData === "object") {
          Object.entries(errorData).forEach(([field, message]) => {
            setError(field as keyof CreateCustomerInput, {
              type: "manual",
              message: Array.isArray(message) ? message[0] : String(message),
            });
          });
        } else {
          toast.error(errorData || "Error al crear el cliente");
        }
      } else {
        toast.error("Error al crear el cliente");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg sm:text-xl">
            Agregar Cliente
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 md:space-y-4 py-4 overflow-y-auto flex-1 min-h-0"
        >
          <Field>
            <FieldLabel
              htmlFor="name"
              required
              className="text-sm text-muted-foreground"
            >
              Nombre
            </FieldLabel>
            <FieldContent>
              <Input
                id="name"
                aria-invalid={errors.name ? "true" : "false"}
                {...register("name")}
              />
              <FieldError errors={errors.name ? [errors.name] : []} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel
              htmlFor="lastName"
              required
              className="text-sm text-muted-foreground"
            >
              Apellido
            </FieldLabel>
            <FieldContent>
              <Input
                id="lastName"
                aria-invalid={errors.lastName ? "true" : "false"}
                {...register("lastName")}
              />
              <FieldError errors={errors.lastName ? [errors.lastName] : []} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel
              htmlFor="phone"
              required
              className="text-sm text-muted-foreground"
            >
              Teléfono
            </FieldLabel>
            <FieldContent>
              <Input
                id="phone"
                aria-invalid={errors.phone ? "true" : "false"}
                {...register("phone")}
              />
              <FieldError errors={errors.phone ? [errors.phone] : []} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel
              htmlFor="address"
              className="text-sm text-muted-foreground"
            >
              Dirección
            </FieldLabel>
            <FieldContent>
              <Input
                id="address"
                aria-invalid={errors.address ? "true" : "false"}
                {...register("address")}
              />
              <FieldError errors={errors.address ? [errors.address] : []} />
            </FieldContent>
          </Field>

          <DialogFooter className="shrink-0 flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Creando...
                </>
              ) : (
                "Crear Cliente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
