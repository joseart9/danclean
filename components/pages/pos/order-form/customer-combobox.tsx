"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
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
import InfiniteScroll from "@/components/ui/infinite-scroll";

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
  const [currentPage, setCurrentPage] = React.useState(0);
  const [allCustomers, setAllCustomers] = React.useState<Customer[]>([]);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const { customers, totalPages, isLoading } = useCustomers({
    searchQuery: searchQuery || undefined,
    enabled: open,
    limit: 10,
    page: currentPage,
  });

  // Track previous search query to detect changes
  const prevSearchQueryRef = React.useRef<string>("");
  const prevOpenRef = React.useRef<boolean>(false);

  // Reset when popover closes or search changes
  React.useEffect(() => {
    // When popover closes, reset everything
    if (!open && prevOpenRef.current) {
      setAllCustomers([]);
      setCurrentPage(0);
      setSearchQuery("");
      setIsLoadingMore(false);
      prevSearchQueryRef.current = "";
    }

    // When popover opens, reset if needed
    if (open && !prevOpenRef.current) {
      setAllCustomers([]);
      setCurrentPage(0);
      setIsLoadingMore(false);
      prevSearchQueryRef.current = "";
    }

    // Reset if search query changed while open
    if (open && prevSearchQueryRef.current !== searchQuery) {
      setAllCustomers([]);
      setCurrentPage(0);
      setIsLoadingMore(false);
      prevSearchQueryRef.current = searchQuery;
    }

    prevOpenRef.current = open;
  }, [open, searchQuery]);

  // Accumulate customers for infinite scroll
  React.useEffect(() => {
    if (!open) return;

    if (customers.length > 0) {
      if (currentPage === 0) {
        // For page 0, replace all customers
        setAllCustomers(customers);
        setIsLoadingMore(false);
      } else {
        // For subsequent pages, append customers (avoid duplicates)
        setAllCustomers((prev: Customer[]) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newCustomers = customers.filter((c) => !existingIds.has(c.id));
          return [...prev, ...newCustomers];
        });
        setIsLoadingMore(false);
      }
    } else if (currentPage === 0 && customers.length === 0 && !isLoading) {
      // Reset if no customers on first page and not loading
      setAllCustomers([]);
      setIsLoadingMore(false);
    }
  }, [customers, currentPage, open, isLoading]);

  // Calculate hasMore for InfiniteScroll
  const hasMore = React.useMemo(() => {
    if (!open) return false;
    if (totalPages > 1) {
      return currentPage < totalPages - 1;
    }
    // If we don't have totalPages yet, check if we got a full page
    const currentLength =
      allCustomers.length > 0 ? allCustomers.length : customers.length;
    return currentLength === 10;
  }, [open, totalPages, currentPage, allCustomers.length, customers.length]);

  // Load next page function for InfiniteScroll
  const loadNextPage = React.useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      setIsLoadingMore(true);
      setCurrentPage((prev: number) => prev + 1);
    }
  }, [hasMore, isLoadingMore, isLoading]);

  const handleCustomerCreated = (customer: Customer) => {
    // Invalidate all customer queries to refresh the list
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    onValueChange(customer);
    setDialogOpen(false);
  };

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
          <Command
            filter={(value, search) => {
              // Always show items with "Agregar cliente" text
              if (value.includes("Agregar cliente")) {
                return 1;
              }
              // Default filtering for other items
              if (!search) return 1;
              const normalizedSearch = search.toLowerCase();
              return value.toLowerCase().includes(normalizedSearch) ? 1 : 0;
            }}
          >
            <CommandInput
              placeholder="Buscar cliente..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  value="Agregar cliente"
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
              {allCustomers.length > 0 || isLoading ? (
                <CommandGroup>
                  <InfiniteScroll
                    hasMore={hasMore}
                    isLoading={isLoadingMore || isLoading}
                    next={loadNextPage}
                    threshold={1}
                  >
                    {allCustomers.map((customer) => (
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
                            value?.id === customer.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {customer.name} {customer.lastName}
                      </CommandItem>
                    ))}
                    {hasMore && (isLoadingMore || isLoading) && (
                      <CommandItem disabled>
                        <Spinner className="h-4 w-4 mr-2" />
                        Cargando más...
                      </CommandItem>
                    )}
                  </InfiniteScroll>
                </CommandGroup>
              ) : (
                <CommandGroup>
                  <CommandItem disabled>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-4 w-full">
                        <Spinner className="h-4 w-4 mr-2" />
                        Cargando...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 py-2 w-full">
                        <span className="text-sm text-muted-foreground text-center">
                          No se encontraron clientes
                        </span>
                      </div>
                    )}
                  </CommandItem>
                </CommandGroup>
              )}
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
