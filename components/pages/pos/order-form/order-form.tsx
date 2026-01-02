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

// Hardcoded cleaning items as requested
const CLEANING_ITEMS = ["VESTIDO", "TRAJE"];

interface CleaningItemFormProps {
  item: { item_name: string; quantity: number };
  index: number;
  onUpdate: (
    index: number,
    item: { item_name: string; quantity: number }
  ) => void;
  onRemove: (index: number) => void;
}

function CleaningItemForm({
  item,
  index,
  onUpdate,
  onRemove,
}: CleaningItemFormProps) {
  const [itemOpen, setItemOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(item.item_name);

  const handleItemSelect = (value: string) => {
    setSelectedItem(value);
    onUpdate(index, { ...item, item_name: value });
    setItemOpen(false);
  };

  const handleQuantityChange = (value: string) => {
    onUpdate(index, { ...item, quantity: parseInt(value) || 1 });
  };

  return (
    <div className="flex gap-2 items-end">
      <Field className="flex-1">
        <FieldLabel>Item</FieldLabel>
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
                <CommandList>
                  <CommandGroup>
                    {CLEANING_ITEMS.map((cleaningItem) => (
                      <CommandItem
                        key={cleaningItem}
                        value={cleaningItem}
                        onSelect={handleItemSelect}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedItem === cleaningItem
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {cleaningItem}
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
        onClick={() => onRemove(index)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
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

  const handleAddCleaningItem = () => {
    addCleaningItem({ item_name: CLEANING_ITEMS[0], quantity: 1 });
  };

  const paymentMethodLabels: Record<OrderPaymentMethod, string> = {
    [OrderPaymentMethod.CASH]: "Efectivo",
    [OrderPaymentMethod.CARD]: "Tarjeta",
    [OrderPaymentMethod.TRANSFER]: "Transferencia",
  };

  return (
    <div className="space-y-6">
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
            <div className="flex gap-2">
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
          <FieldLabel required>Items de Tintoreria</FieldLabel>
          <FieldContent>
            <div className="space-y-3">
              {formData.cleaningItems.length === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCleaningItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar item
                </Button>
              ) : (
                <>
                  {formData.cleaningItems.map((item, index) => (
                    <CleaningItemForm
                      key={index}
                      item={item}
                      index={index}
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
          <div className="pt-4">
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
