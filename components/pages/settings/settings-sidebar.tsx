"use client";

import { Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSidebarProps {
  activeOption: string;
  onOptionChange: (option: string) => void;
}

const SETTINGS_OPTIONS = [
  {
    id: "usuarios",
    label: "Usuarios",
    icon: Users,
  },
  {
    id: "opciones-limpieza",
    label: "Opciones de Tintoreria",
    icon: Sparkles,
  },
] as const;

export function SettingsSidebar({
  activeOption,
  onOptionChange,
}: SettingsSidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/40 p-4">
      <h2 className="mb-4 text-lg font-semibold">Configuración</h2>
      <nav className="space-y-1">
        {SETTINGS_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = activeOption === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onOptionChange(option.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
