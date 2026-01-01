import { z } from "zod";

// Use enum values directly to avoid importing Prisma client in client components
const Role = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

type Role = (typeof Role)[keyof typeof Role];

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  lastName: z.string().min(1, "Last name is required").optional(),
  role: z.nativeEnum(Role).default(Role.USER),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  name: z.string().min(1, "Name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  role: z.nativeEnum(Role).optional(),
});

export type LoginUserInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
