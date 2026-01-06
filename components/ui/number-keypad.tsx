"use client";

import { Button } from "@/components/ui/button";
import { Delete, Dot } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberKeypadProps {
  onNumberClick: (value: string) => void;
  onDelete: () => void;
  onClear: () => void;
  className?: string;
}

export function NumberKeypad({
  onNumberClick,
  onDelete,
  onClear,
  className,
}: NumberKeypadProps) {
  const numbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "del"],
  ];

  const handleClick = (value: string) => {
    if (value === "del") {
      onDelete();
    } else {
      onNumberClick(value);
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-2.5 md:gap-3 p-3 md:p-4 bg-muted/30 rounded-lg",
        className
      )}
    >
      {numbers.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          const isDelete = value === "del";
          const isDot = value === ".";

          return (
            <Button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              variant="outline"
              size="lg"
              className={cn(
                "h-14 md:h-16 text-xl md:text-2xl font-semibold touch-manipulation",
                isDelete &&
                  "bg-destructive/10 hover:bg-destructive/20 text-destructive"
              )}
              onClick={() => handleClick(value)}
            >
              {isDelete ? (
                <Delete className="h-6 w-6 md:h-7 md:w-7" />
              ) : isDot ? (
                <Dot className="h-6 w-6 md:h-7 md:w-7" />
              ) : (
                value
              )}
            </Button>
          );
        })
      )}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="col-span-3 h-12 md:h-14 text-sm md:text-base touch-manipulation"
        onClick={onClear}
      >
        Limpiar
      </Button>
    </div>
  );
}
