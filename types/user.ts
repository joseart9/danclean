import { Role } from "@/generated/prisma/client";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  lastName: string;
  role: Role;
}
