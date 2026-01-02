import { Home, List, ShoppingCart, Truck, Users } from "lucide-react";

const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export const ROUTES = [
  {
    href: "/",
    label: "Dashboard",
    icon: Home,
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
    permissions: [ROLES.ADMIN],
  },
];
