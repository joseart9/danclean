"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCustomers } from "@/hooks/useCustomers";
import type { Customer } from "@/types/customer";
import { CustomerDialog } from "./customer-dialog";
import { Spinner } from "@/components/ui/spinner";

interface CustomerComboboxProps {
  value?: Customer | null;
  onValueChange: (customer: Customer | null) => void;
}

export function CustomerCombobox({
  value,
  onValueChange,
}: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const listRef = React.useRef<HTMLDivElement>(null);

  const {
    customers,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCustomers({
    searchQuery: searchQuery || undefined,
    enabled: open,
    limit: 10,
  });

  const handleCustomerCreated = (customer: Customer) => {
    // Invalidate all customer queries to refresh the list
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    onValueChange(customer);
    setDialogOpen(false);
  };

  // Handle infinite scroll
  React.useEffect(() => {
    const listElement = listRef.current;
    if (!listElement || !open) return;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = target;
      // Load more when user is near the bottom (within 50px)
      if (
        scrollHeight - scrollTop - clientHeight < 50 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    listElement.addEventListener("scroll", handleScroll);
    return () => listElement.removeEventListener("scroll", handleScroll);
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? `${value.name} ${value.lastName}`
              : "Seleccionar cliente..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar cliente..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList ref={listRef}>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setDialogOpen(true);
                  }}
                  className="text-primary font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar cliente
                </CommandItem>
              </CommandGroup>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={`${customer.name} ${customer.lastName}`}
                    onSelect={() => {
                      onValueChange(customer);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.id === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {customer.name} {customer.lastName}
                  </CommandItem>
                ))}
                {isFetchingNextPage && (
                  <CommandItem disabled>
                    <Spinner className="h-4 w-4 mr-2" />
                    Cargando más...
                  </CommandItem>
                )}
              </CommandGroup>
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner className="h-4 w-4 mr-2" />
                    Cargando...
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 py-2">
                    <span className="text-sm text-muted-foreground text-center">
                      No se encontraron clientes
                    </span>
                  </div>
                )}
              </CommandEmpty>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  );
}
