"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginUserInput } from "@/validators/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginUserInput>();

  const onSubmit = async (data: LoginUserInput) => {
    // Validate with Zod
    const validationResult = loginSchema.safeParse(data);
    if (!validationResult.success) {
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginUserInput;
        setError(field, {
          type: "manual",
          message: issue.message,
        });
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle API errors
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.error("Error al iniciar sesión");
        }
        return;
      }

      // Success - token is now in cookie, redirect to home
      toast.success("Inicio de sesión exitoso");
      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
          <p className="text-muted-foreground mt-2">
            Ingresa tus credenciales para acceder
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <FieldContent>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                aria-invalid={errors.email ? "true" : "false"}
                {...register("email")}
              />
              <FieldError errors={errors.email ? [errors.email] : []} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <FieldContent>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                aria-invalid={errors.password ? "true" : "false"}
                {...register("password")}
              />
              <FieldError errors={errors.password ? [errors.password] : []} />
            </FieldContent>
          </Field>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
