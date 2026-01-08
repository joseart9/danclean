import { z } from "zod";

export const createExpenseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  amount: z.number().positive("El monto debe ser positivo"),
  timestamp: z.coerce.date().optional(),
});

export const updateExpenseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  amount: z.number().positive("El monto debe ser positivo").optional(),
  timestamp: z.coerce.date().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
