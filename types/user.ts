import { Role } from "@/generated/prisma/browser";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  lastName: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
