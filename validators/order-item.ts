import { z } from "zod";

// Types
import { OrderType } from "@/types/order";

export const createOrderItemSchema = z.object({
  type: z.nativeEnum(OrderType),
  orderId: z.string().uuid("El ID de la orden debe ser un UUID válido"),
  itemId: z.string().uuid("El ID del item debe ser un UUID válido"),
});

export const updateOrderItemSchema = z.object({
  type: z.nativeEnum(OrderType).optional(),
  orderId: z
    .string()
    .uuid("El ID de la orden debe ser un UUID válido")
    .optional(),
  itemId: z.string().uuid("El ID del item debe ser un UUID válido").optional(),
});

export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>;
