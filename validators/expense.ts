import { z } from "zod";

export const createExpenseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  amount: z.number().positive("El monto debe ser positivo"),
});

export const updateExpenseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  amount: z.number().positive("El monto debe ser positivo").optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
