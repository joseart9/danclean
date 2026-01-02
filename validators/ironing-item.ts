import { z } from "zod";

export const createIroningItemSchema = z.object({
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  total: z.number().nonnegative("El total debe ser no negativo"),
});

export const updateIroningItemSchema = z.object({
  quantity: z
    .number()
    .int()
    .positive("La cantidad debe ser positiva")
    .optional(),
  total: z.number().nonnegative("El total debe ser no negativo").optional(),
});

export type CreateIroningItemInput = z.infer<typeof createIroningItemSchema>;
export type UpdateIroningItemInput = z.infer<typeof updateIroningItemSchema>;
