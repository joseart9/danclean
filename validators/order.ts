import { z } from "zod";

// Types
import {
  OrderType,
  OrderPaymentStatus,
  OrderPaymentMethod,
  OrderStatus,
} from "@/types/order";

// Schema for IRONING items (single object with quantity)
const ironingItemsSchema = z.object({
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
});

// Schema for CLEANING items (array of items with name and quantity)
const cleaningItemsSchema = z.array(
  z.object({
    item_name: z.string().min(1, "El nombre del item es requerido"),
    quantity: z.number().int().positive("La cantidad debe ser positiva"),
  })
);

export const createOrderSchema = z
  .object({
    type: z.nativeEnum(OrderType),
    customerId: z.string().uuid("El ID del cliente debe ser un UUID válido"),
    paymentMethod: z
      .nativeEnum(OrderPaymentMethod)
      .default(OrderPaymentMethod.CASH),
    paymentStatus: z
      .nativeEnum(OrderPaymentStatus)
      .default(OrderPaymentStatus.PENDING),
    status: z.nativeEnum(OrderStatus).default(OrderStatus.PENDING),
    totalPaid: z
      .number()
      .nonnegative("El monto pagado no puede ser negativo")
      .default(0),
  })
  .and(
    z.union([
      // IRONING order
      z.object({
        type: z.literal(OrderType.IRONING),
        items: ironingItemsSchema,
      }),
      // CLEANING order
      z.object({
        type: z.literal(OrderType.CLEANING),
        items: cleaningItemsSchema,
      }),
    ])
  );

export const updateOrderSchema = z.object({
  type: z.nativeEnum(OrderType).optional(),
  customerId: z
    .string()
    .uuid("El ID del cliente debe ser un UUID válido")
    .optional(),
  paymentStatus: z.nativeEnum(OrderPaymentStatus).optional(),
  paymentMethod: z.nativeEnum(OrderPaymentMethod).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  total: z.number().nonnegative("El total debe ser no negativo").optional(),
  totalPaid: z
    .number()
    .nonnegative("El monto pagado no puede ser negativo")
    .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
