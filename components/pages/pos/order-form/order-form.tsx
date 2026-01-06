"use client";

import { useOrderForm } from "./order-form-context";
import { CustomerCombobox } from "./customer-combobox";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { OrderType, OrderPaymentMethod } from "@/types/order";
import { Plus, Trash2 } from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderCompletionDialog } from "./order-completion-dialog";
import { useCleaningItemOptions } from "@/hooks/useCleaningItemOptions";
import { CommandInput, CommandEmpty } from "@/components/ui/command";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface CleaningItemFormProps {
  item: { id: string; item_name: string; quantity: number; price: number };
  onUpdate: (
    id: string,
    item: { item_name: string; quantity: number; price: number }
  ) => void;
  onRemove: (id: string) => void;
}

function CleaningItemForm({ item, onUpdate, onRemove }: CleaningItemFormProps) {
  const [itemOpen, setItemOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(item.item_name);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { data: cleaningItemOptions, isLoading } = useCleaningItemOptions();

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
      onUpdate(item.id, {
        item_name: itemName,
        quantity: item.quantity,
        price: initialPrice,
      });
      setItemOpen(false);
      setSearchQuery("");
    }
  };

  const handleQuantityChange = (value: string) => {
    onUpdate(item.id, {
      item_name: item.item_name,
      quantity: parseInt(value) || 1,
      price: item.price,
    });
  };

  const handlePriceChange = (value: number[]) => {
    onUpdate(item.id, {
      item_name: item.item_name,
      quantity: item.quantity,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-2 md:space-y-3 rounded-lg p-2 md:p-3 border border-border">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
        <Field className="flex-1 min-w-0">
          <FieldContent>
            <Popover open={itemOpen} onOpenChange={setItemOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={itemOpen}
                  className="w-full justify-between text-sm sm:text-base"
                >
                  <span className="truncate">
                    {selectedItem || "Seleccionar item..."}
                  </span>
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
                      {isLoading ? "Cargando..." : "No se encontraron prendas"}
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

        <Field className="w-full sm:w-28 md:w-32">
          <FieldLabel className="text-xs sm:text-sm">Cantidad</FieldLabel>
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
          onClick={() => onRemove(item.id)}
          className="shrink-0 self-end sm:self-auto"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {selectedItem && (
        <Field>
          <FieldContent>
            {hasPriceRange ? (
              <div className="space-y-2 md:space-y-3">
                <div className="bg-muted/50 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Precio seleccionado
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-foreground">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <div className="text-left sm:text-right flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Rango disponible
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
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
              <div className="bg-muted/50 rounded-lg p-3 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Precio por unidad
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-foreground">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                  <div className="text-left sm:text-right flex flex-col gap-1">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {item.quantity} unidad{item.quantity > 1 ? "es" : ""}
                    </span>
                    <span className="text-base sm:text-lg font-semibold text-foreground">
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

export function OrderForm() {
  const {
    formData,
    setCustomer,
    setOrderType,
    setIroningQuantity,
    addCleaningItem,
    removeCleaningItem,
    updateCleaningItem,
    setPaymentMethod,
    calculateTotal,
    resetForm,
  } = useOrderForm();

  const [paymentMethodOpen, setPaymentMethodOpen] = React.useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = React.useState(false);
  const { data: cleaningItemOptions } = useCleaningItemOptions();

  const handleAddCleaningItem = () => {
    const firstItem = cleaningItemOptions[0];
    if (firstItem) {
      addCleaningItem({
        item_name: firstItem.name,
        quantity: 1,
        price: firstItem.price,
      });
    }
  };

  const paymentMethodLabels: Record<OrderPaymentMethod, string> = {
    [OrderPaymentMethod.CASH]: "Efectivo",
    [OrderPaymentMethod.CARD]: "Tarjeta",
    [OrderPaymentMethod.TRANSFER]: "Transferencia",
  };

  return (
    <div className="space-y-4 md:space-y-5 lg:space-y-6">
      {/* Customer Selection */}
      <Field>
        <FieldLabel required>Cliente</FieldLabel>
        <FieldContent>
          <CustomerCombobox
            value={formData.customer}
            onValueChange={setCustomer}
          />
        </FieldContent>
      </Field>

      {/* Order Type Selection */}
      {formData.customer && (
        <Field>
          <FieldLabel required>Tipo de Orden</FieldLabel>
          <FieldContent>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant={
                  formData.type === OrderType.IRONING ? "default" : "outline"
                }
                onClick={() => setOrderType(OrderType.IRONING)}
                className="flex-1"
              >
                Planchado
              </Button>
              <Button
                type="button"
                variant={
                  formData.type === OrderType.CLEANING ? "default" : "outline"
                }
                onClick={() => setOrderType(OrderType.CLEANING)}
                className="flex-1"
              >
                Tintoreria
              </Button>
            </div>
          </FieldContent>
        </Field>
      )}

      {/* IRONING Quantity */}
      {formData.type === OrderType.IRONING && (
        <Field>
          <FieldLabel required>Cantidad</FieldLabel>
          <FieldContent>
            <Select
              value={formData.ironingQuantity?.toString()}
              onValueChange={(value) =>
                setIroningQuantity(value ? parseInt(value) : null)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar cantidad..." />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
      )}

      {/* CLEANING Items */}
      {formData.type === OrderType.CLEANING && (
        <Field>
          <FieldLabel required>Prendas</FieldLabel>
          <FieldContent>
            <div className="space-y-2 md:space-y-3">
              {formData.cleaningItems.length === 0 ? (
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
                  {formData.cleaningItems.map((item) => (
                    <CleaningItemForm
                      key={item.id}
                      item={item}
                      onUpdate={updateCleaningItem}
                      onRemove={removeCleaningItem}
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
          </FieldContent>
        </Field>
      )}

      {/* Payment Method */}
      {formData.type && (
        <Field>
          <FieldLabel required>Método de Pago</FieldLabel>
          <FieldContent>
            <Popover
              open={paymentMethodOpen}
              onOpenChange={setPaymentMethodOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={paymentMethodOpen}
                  className="w-full justify-between"
                >
                  {formData.paymentMethod
                    ? paymentMethodLabels[formData.paymentMethod]
                    : "Seleccionar método de pago..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {Object.values(OrderPaymentMethod).map((method) => (
                        <CommandItem
                          key={method}
                          value={paymentMethodLabels[method]}
                          onSelect={() => {
                            setPaymentMethod(method);
                            setPaymentMethodOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.paymentMethod === method
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {paymentMethodLabels[method]}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FieldContent>
        </Field>
      )}

      {/* Submit Button */}
      {formData.type &&
        formData.paymentMethod &&
        ((formData.type === OrderType.IRONING && formData.ironingQuantity) ||
          (formData.type === OrderType.CLEANING &&
            formData.cleaningItems.length > 0)) && (
          <div className="pt-2 md:pt-3 lg:pt-4">
            <Button
              type="button"
              onClick={() => setCompletionDialogOpen(true)}
              className="w-full"
              size="lg"
            >
              Terminar
            </Button>
          </div>
        )}

      {/* Completion Dialog */}
      <OrderCompletionDialog
        open={completionDialogOpen}
        onOpenChange={setCompletionDialogOpen}
        formData={formData}
        total={calculateTotal()}
        onOrderCompleted={resetForm}
      />
    </div>
  );
}
