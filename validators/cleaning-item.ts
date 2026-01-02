import { z } from "zod";

export const createCleaningItemSchema = z.object({
  item_name: z.string().min(1, "El nombre del item es requerido"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  total: z.number().nonnegative("El total debe ser no negativo"),
});

export const updateCleaningItemSchema = z.object({
  item_name: z.string().min(1, "El nombre del item es requerido").optional(),
  quantity: z
    .number()
    .int()
    .positive("La cantidad debe ser positiva")
    .optional(),
  total: z.number().nonnegative("El total debe ser no negativo").optional(),
});

export type CreateCleaningItemInput = z.infer<typeof createCleaningItemSchema>;
export type UpdateCleaningItemInput = z.infer<typeof updateCleaningItemSchema>;
