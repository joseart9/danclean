"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useMe } from "@/hooks/useMe";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: user } = useMe();

  // Filter routes based on user role and route permissions
  const filteredRoutes = ROUTES.filter((route) => {
    // If route has no permissions, it's accessible to everyone
    if (!route.permissions) return true;

    // If user is not loaded, don't show protected routes
    if (!user) return false;

    // Check if user's role is in the allowed permissions
    return route.permissions.includes(user.role);
  });

  // Transform ROUTES to match NavMain's expected format
  const navMainItems = filteredRoutes.map((route) => ({
    title: route.label,
    url: route.href,
    icon: route.icon,
    isActive: pathname === route.href || pathname.startsWith(`${route.href}/`),
  }));

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Dan Clean</span>
                  <span className="truncate text-xs">Tintorería</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user ?? null} />
      </SidebarFooter>
    </Sidebar>
  );
}
