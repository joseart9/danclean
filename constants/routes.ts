import {
  Home,
  List,
  BarChart,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
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
  {
    href: "/reports",
    label: "Reportes",
    icon: BarChart,
    permissions: ["ADMIN"],
  },
  {
    href: "/expenses",
    label: "Gastos",
    icon: Wallet,
    permissions: ["ADMIN"],
  },
];
