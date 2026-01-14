"use client";

import * as React from "react";
import { OrderType } from "@/types/order";
import type { FullOrder } from "@/types/order";
import { formatCurrency } from "./formatters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
  CommandEmpty,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCleaningItemOptions } from "@/hooks/useCleaningItemOptions";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditableOrderItemsProps {
  order: FullOrder;
  isEditing: boolean;
  onItemsChange: (
    items:
      | { quantity: number }
      | Array<{ id?: string; item_name: string; quantity: number; price: number }>
  ) => void;
}

interface CleaningItemData {
  id?: string;
  item_name: string;
  quantity: number;
  price: number;
}

function EditableCleaningItemForm({
  item,
  onUpdate,
  onRemove,
}: {
  item: CleaningItemData;
  onUpdate: (item: CleaningItemData) => void;
  onRemove: () => void;
}) {
  const [itemOpen, setItemOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(item.item_name);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { data: cleaningItemOptions } = useCleaningItemOptions();

  const selectedOption = React.useMemo(() => {
    return cleaningItemOptions.find((option) => option.name === item.item_name);
  }, [cleaningItemOptions, item.item_name]);

  const hasPriceRange =
    selectedOption?.toPrice !== null && selectedOption?.toPrice !== undefined;
  const minPrice = selectedOption?.price ?? 0;
  const maxPrice = selectedOption?.toPrice ?? selectedOption?.price ?? 0;

  const handleItemSelect = (itemName: string) => {
    const option = cleaningItemOptions.find((opt) => opt.name === itemName);
    if (option) {
      setSelectedItem(itemName);
      const initialPrice = option.price;
      onUpdate({
        ...item,
        item_name: itemName,
        price: initialPrice,
      });
      setItemOpen(false);
      setSearchQuery("");
    }
  };

  const handleQuantityChange = (value: string) => {
    onUpdate({
      ...item,
      quantity: parseInt(value) || 1,
    });
  };

  const handlePriceChange = (value: number[]) => {
    onUpdate({
      ...item,
      price: value[0],
    });
  };

  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return cleaningItemOptions;
    const query = searchQuery.toLowerCase();
    return cleaningItemOptions.filter((option) =>
      option.name.toLowerCase().includes(query)
    );
  }, [cleaningItemOptions, searchQuery]);

  return (
    <div className="space-y-3 rounded-lg p-3 border border-border bg-muted/30">
      <div className="flex gap-2 items-end">
        <Field className="flex-1">
          <FieldContent>
            <Popover open={itemOpen} onOpenChange={setItemOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={itemOpen}
                  className="w-full justify-between"
                >
                  {selectedItem || "Seleccionar item..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar prenda..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      No se encontraron prendas
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredItems.map((cleaningItemOption) => (
                        <CommandItem
                          key={cleaningItemOption.id}
                          value={cleaningItemOption.name}
                          onSelect={() =>
                            handleItemSelect(cleaningItemOption.name)
                          }
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedItem === cleaningItemOption.name
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {cleaningItemOption.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FieldContent>
        </Field>

        <Field className="w-32">
          <FieldLabel>Cantidad</FieldLabel>
          <FieldContent>
            <Select
              value={item.quantity.toString()}
              onValueChange={handleQuantityChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {selectedItem && (
        <Field>
          <FieldContent>
            {hasPriceRange ? (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">
                        Precio seleccionado
                      </span>
                      <span className="text-2xl font-bold text-foreground">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <div className="text-right flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Rango disponible
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[item.price]}
                    onValueChange={handlePriceChange}
                    min={minPrice}
                    max={maxPrice}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity} unidad{item.quantity > 1 ? "es" : ""} ×{" "}
                    {formatCurrency(item.price)}
                  </span>
                  <span className="font-semibold text-foreground">
                    Total: {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">
                      Precio por unidad
                    </span>
                    <span className="text-2xl font-bold text-foreground">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                  <div className="text-right flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">
                      {item.quantity} unidad{item.quantity > 1 ? "es" : ""}
                    </span>
                    <span className="text-lg font-semibold text-foreground">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </FieldContent>
        </Field>
      )}
    </div>
  );
}

export function EditableOrderItems({
  order,
  isEditing,
  onItemsChange,
}: EditableOrderItemsProps) {
  const isIroning = order.type === OrderType.IRONING;

  // Parse items from order - items have id, quantity, total, and for cleaning: item_name
  const getInitialItems = React.useCallback(() => {
    if (isIroning) {
      const item = order.items as { id: string; quantity: number; total: number } | null;
      return item ? [item] : [];
    } else {
      return Array.isArray(order.items)
        ? (order.items as Array<{
            id: string;
            item_name: string;
            quantity: number;
            total: number;
          }>)
        : [];
    }
  }, [order.items, isIroning]);

  const initialItems = getInitialItems();

  // State for IRONING
  const [ironingQuantity, setIroningQuantity] = React.useState<number>(
    isIroning && initialItems.length > 0
      ? (initialItems[0] as { quantity: number }).quantity
      : 1
  );

  // State for CLEANING - preserve item IDs
  const [cleaningItems, setCleaningItems] = React.useState<CleaningItemData[]>(() => {
    if (isIroning) return [];
    return initialItems.map((item) => {
      const cleaningItem = item as {
        id: string;
        item_name: string;
        quantity: number;
        total: number;
      };
      return {
        id: cleaningItem.id, // Preserve the item ID for updates
        item_name: cleaningItem.item_name,
        quantity: cleaningItem.quantity,
        price: cleaningItem.total / cleaningItem.quantity, // Calculate price from total
      };
    });
  });

  const { data: cleaningItemOptions } = useCleaningItemOptions();

  // Reset state when order changes or editing mode changes
  React.useEffect(() => {
    if (isEditing) {
      const currentInitialItems = getInitialItems();
      if (isIroning) {
        setIroningQuantity(
          currentInitialItems.length > 0
            ? (currentInitialItems[0] as { quantity: number }).quantity
            : 1
        );
      } else {
        setCleaningItems(
          currentInitialItems.map((item) => {
            const cleaningItem = item as {
              id: string;
              item_name: string;
              quantity: number;
              total: number;
            };
            return {
              id: cleaningItem.id,
              item_name: cleaningItem.item_name,
              quantity: cleaningItem.quantity,
              price: cleaningItem.total / cleaningItem.quantity,
            };
          })
        );
      }
    }
  }, [order.id, isEditing, isIroning, getInitialItems]); // Reset when order changes or editing mode changes

  // Update parent when items change
  React.useEffect(() => {
    if (isIroning) {
      onItemsChange({ quantity: ironingQuantity });
    } else {
      onItemsChange(cleaningItems);
    }
  }, [ironingQuantity, cleaningItems, isIroning, onItemsChange]);

  const handleAddCleaningItem = () => {
    const firstItem = cleaningItemOptions[0];
    if (firstItem) {
      setCleaningItems((prev) => [
        ...prev,
        {
          item_name: firstItem.name,
          quantity: 1,
          price: firstItem.price,
        },
      ]);
    }
  };

  const handleUpdateCleaningItem = (index: number, updatedItem: CleaningItemData) => {
    setCleaningItems((prev) => {
      const newItems = [...prev];
      newItems[index] = updatedItem;
      return newItems;
    });
  };

  const handleRemoveCleaningItem = (index: number) => {
    setCleaningItems((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isEditing) {
    // Display mode - use the existing OrderItemsDisplay logic
    return (
      <div className="space-y-3">
        {isIroning
          ? initialItems.length > 0 && (
              <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                <div>
                  <p className="font-medium">Planchado</p>
                  <p className="text-sm text-muted-foreground">
                    {initialItems[0].quantity} piezas
                  </p>
                </div>
                <p className="font-medium">
                  {formatCurrency(initialItems[0].total)}
                </p>
              </div>
            )
          : initialItems.map((item, index) => {
              const cleaningItem = item as {
                item_name: string;
                quantity: number;
                total: number;
              };
              return (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted rounded-md"
                >
                  <div>
                    <p className="font-medium">{cleaningItem.item_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {cleaningItem.quantity} unidades
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(cleaningItem.total)}
                  </p>
                </div>
              );
            })}
      </div>
    );
  }

  // Editing mode
  if (isIroning) {
    return (
      <div className="space-y-3">
        <Field>
          <FieldLabel>Cantidad</FieldLabel>
          <FieldContent>
            <Select
              value={ironingQuantity.toString()}
              onValueChange={(value) => {
                setIroningQuantity(parseInt(value) || 1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
      </div>
    );
  }

  // CLEANING editing mode
  return (
    <div className="space-y-3">
      {cleaningItems.length === 0 ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddCleaningItem}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar prenda
        </Button>
      ) : (
        <>
          {cleaningItems.map((item, index) => (
            <EditableCleaningItemForm
              key={index}
              item={item}
              onUpdate={(updatedItem) =>
                handleUpdateCleaningItem(index, updatedItem)
              }
              onRemove={() => handleRemoveCleaningItem(index)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCleaningItem}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar más
          </Button>
        </>
      )}
    </div>
  );
}
