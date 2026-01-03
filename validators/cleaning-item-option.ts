import { z } from "zod";

export const createCleaningItemOptionSchema = z
  .object({
    name: z.string().min(1, "El nombre es requerido"),
    price: z.number().positive("El precio debe ser positivo"),
    toPrice: z
      .number()
      .positive("El precio máximo debe ser positivo")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.toPrice !== undefined && data.toPrice !== null) {
        return data.toPrice >= data.price;
      }
      return true;
    },
    {
      message: "El precio máximo debe ser mayor o igual al precio mínimo",
      path: ["toPrice"],
    }
  );

export const updateCleaningItemOptionSchema = z
  .object({
    name: z.string().min(1, "El nombre es requerido").optional(),
    price: z.number().positive("El precio debe ser positivo").optional(),
    toPrice: z
      .number()
      .positive("El precio máximo debe ser positivo")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Only validate if both prices are provided
      if (
        data.price !== undefined &&
        data.toPrice !== undefined &&
        data.toPrice !== null
      ) {
        return data.toPrice >= data.price;
      }
      return true;
    },
    {
      message: "El precio máximo debe ser mayor o igual al precio mínimo",
      path: ["toPrice"],
    }
  );

export type CreateCleaningItemOptionInput = z.infer<
  typeof createCleaningItemOptionSchema
>;
export type UpdateCleaningItemOptionInput = z.infer<
  typeof updateCleaningItemOptionSchema
>;
