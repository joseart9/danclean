import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  lastName: z.string().min(1, "El apellido es requerido").optional(),
  phone: z.string().min(1, "El teléfono es requerido").optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
