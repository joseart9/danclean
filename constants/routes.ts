import {
  Home,
  List,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/generated/prisma/browser";

export type Route = {
  href: string;
  label: string;
  icon: LucideIcon;
  permissions?: Role[];
};

export const ROUTES: Route[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: Home,
    permissions: ["ADMIN"],
  },
  {
    href: "/pos",
    label: "Punto de Venta",
    icon: ShoppingCart,
  },
  {
    href: "/orders",
    label: "Ordenes",
    icon: List,
  },
  {
    href: "/delivery",
    label: "Entregas",
    icon: Truck,
  },
  {
    href: "/customers",
    label: "Clientes",
    icon: Users,
    permissions: ["ADMIN"],
  },
];
