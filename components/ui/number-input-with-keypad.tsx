"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { NumberKeypad } from "@/components/ui/number-keypad";
import { useIsTablet } from "@/hooks/use-tablet";
import { cn } from "@/lib/utils";

interface NumberInputWithKeypadProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange: (value: string) => void;
  hideKeypad?: boolean;
}

export function NumberInputWithKeypad({
  value,
  onValueChange,
  className,
  hideKeypad = false,
  ...props
}: NumberInputWithKeypadProps) {
  const isTablet = useIsTablet();
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Prevent keyboard from showing on tablet
  React.useEffect(() => {
    if (isTablet && inputRef.current) {
      inputRef.current.setAttribute("readonly", "");
      inputRef.current.addEventListener("focus", (e) => {
        e.preventDefault();
        inputRef.current?.blur();
      });
    }
  }, [isTablet]);

  const handleNumberClick = (num: string) => {
    if (num === ".") {
      // Only allow one decimal point
      if (!value.includes(".")) {
        // If empty, add "0." instead of just "."
        onValueChange(value === "" ? "0." : value + num);
      }
    } else {
      // Handle leading zeros - if value is "0", replace it
      if (value === "0") {
        onValueChange(num);
      } else {
        onValueChange(value + num);
      }
    }
  };

  const handleDelete = () => {
    onValueChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onValueChange("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow manual input on non-tablet devices
    if (!isTablet) {
      onValueChange(e.target.value);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col",
        isTablet && !hideKeypad && "md:flex-row md:items-start md:gap-4",
        !isTablet && !hideKeypad && "space-y-3"
      )}
    >
      <div className={cn(isTablet && !hideKeypad && "md:w-48 md:shrink-0")}>
        <Input
          ref={inputRef}
          type="text"
          inputMode="none"
          value={value}
          onChange={handleInputChange}
          className={cn(
            "text-center text-lg sm:text-xl font-semibold w-full",
            isTablet && "cursor-pointer",
            className
          )}
          onClick={() => {
            if (isTablet && inputRef.current) {
              inputRef.current.blur();
            }
          }}
          {...props}
        />
      </div>
      {isTablet && !hideKeypad && (
        <div className="md:flex-1 md:min-w-0">
          <NumberKeypad
            onNumberClick={handleNumberClick}
            onDelete={handleDelete}
            onClear={handleClear}
          />
        </div>
      )}
    </div>
  );
}
