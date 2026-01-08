"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderType,
} from "@/types/order";
import type { OrderFormData } from "./order-form-context";
import { useQueryClient } from "@tanstack/react-query";

interface OrderCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: OrderFormData;
  total: number;
  onOrderCompleted: () => void;
  date: Date;
}

const paymentMethodLabels: Record<OrderPaymentMethod, string> = {
  [OrderPaymentMethod.CASH]: "Efectivo",
  [OrderPaymentMethod.CARD]: "Tarjeta",
  [OrderPaymentMethod.TRANSFER]: "Transferencia",
};

export function OrderCompletionDialog({
  open,
  onOpenChange,
  formData,
  total,
  onOrderCompleted,
  date,
}: OrderCompletionDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [createdOrderNumber, setCreatedOrderNumber] = useState<number | null>(
    null
  );
  const [showOrderNumberDialog, setShowOrderNumberDialog] = useState(false);

  const isCash = formData.paymentMethod === OrderPaymentMethod.CASH;
  const amountPaidNum = parseFloat(amountPaid) || 0;
  // For cash, actual amount paid toward order is capped at total (change is given back)
  // For other payment methods, amount cannot exceed total
  const actualAmountPaid = Math.min(amountPaidNum, total);
  const change = isCash && amountPaidNum > total ? amountPaidNum - total : 0;
  const isPartialPayment = amountPaidNum > 0 && amountPaidNum < total;
  const isFullPayment = amountPaidNum >= total;
  const remaining = total - amountPaidNum;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentStatus = (): OrderPaymentStatus => {
    if (amountPaidNum >= total) {
      return OrderPaymentStatus.PAID;
    } else if (amountPaidNum > 0) {
      return OrderPaymentStatus.PARTIALLY_PAID;
    } else {
      return OrderPaymentStatus.PENDING;
    }
  };

  const handleSubmit = async () => {
    // Validate amount
    if (amountPaidNum < 0) {
      toast.error("El monto no puede ser negativo");
      return;
    }

    // For non-cash payments, amount cannot exceed total
    // For cash payments, overpayment is allowed (change will be given)
    if (!isCash && amountPaidNum > total) {
      toast.error("El monto pagado no puede exceder el total");
      return;
    }

    if (!formData.customer || !formData.type || !formData.paymentMethod) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setIsLoading(true);
    try {
      // Prepare order data
      const paymentStatus = getPaymentStatus();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderData: any = {
        type: formData.type,
        customerId: formData.customer.id,
        paymentMethod: formData.paymentMethod,
        paymentStatus,
        status: "PENDING",
        totalPaid: actualAmountPaid,
        paid: actualAmountPaid,
        timestamp: date,
      };

      // Add items based on type
      if (formData.type === OrderType.IRONING && formData.ironingQuantity) {
        orderData.items = {
          quantity: formData.ironingQuantity,
        };
      } else if (
        formData.type === OrderType.CLEANING &&
        formData.cleaningItems.length > 0
      ) {
        // Strip the id field before sending to API
        orderData.items = formData.cleaningItems.map(({ id, ...item }) => item);
      } else {
        toast.error("Por favor completa los items de la orden");
        setIsLoading(false);
        return;
      }

      const response = await apiClient.post("/orders", orderData);
      const order = response.data;

      // Invalidate orders query to refresh the orders table
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // Show order number dialog
      if (order?.orderNumber) {
        setCreatedOrderNumber(order.orderNumber);
        setShowOrderNumberDialog(true);
      } else {
        toast.success("Orden creada exitosamente");
      }

      onOrderCompleted();
      setAmountPaid("");
      onOpenChange(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error creating order:", error);

      if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        if (typeof errorData === "object") {
          toast.error("Error al crear la orden. Por favor verifica los datos");
        } else {
          toast.error(errorData || "Error al crear la orden");
        }
      } else {
        toast.error("Error al crear la orden");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderNumberDialogClose = () => {
    setShowOrderNumberDialog(false);
    setCreatedOrderNumber(null);
  };

  return (
    <>
      {/* Order Number Success Dialog */}
      <Dialog
        open={showOrderNumberDialog}
        onOpenChange={handleOrderNumberDialogClose}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-center">
              ¡Orden Creada Exitosamente!
            </DialogTitle>
            <DialogDescription className="text-center">
              Tu orden ha sido registrada en el sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Número de Orden
              </p>
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10 border-4 border-primary">
                <span className="text-4xl font-bold text-primary">
                  {createdOrderNumber}
                </span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Guarda este número para referencia futura
            </p>
          </div>

          <DialogFooter className="shrink-0">
            <Button onClick={handleOrderNumberDialogClose} className="w-full">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Completion Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Finalizar Orden</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            {/* Total */}
            <Field>
              <FieldLabel className="text-sm text-muted-foreground">
                Total
              </FieldLabel>
              <FieldContent>
                <p className="text-lg font-bold">{formatCurrency(total)}</p>
              </FieldContent>
            </Field>

            {/* Payment Method */}
            <Field>
              <FieldLabel className="text-sm text-muted-foreground">
                Método de Pago
              </FieldLabel>
              <FieldContent>
                <p className="text-sm">
                  {formData.paymentMethod
                    ? paymentMethodLabels[formData.paymentMethod]
                    : "-"}
                </p>
              </FieldContent>
            </Field>

            {/* Amount Paid Field - For all payment methods */}
            <Field>
              <FieldLabel required className="text-sm text-muted-foreground">
                Monto Pagado (Puede ser parcial)
              </FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  placeholder="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  min={0}
                  step="0.01"
                  max={isCash ? undefined : total}
                />
              </FieldContent>
            </Field>

            {/* Payment Status and Details */}
            {amountPaidNum > 0 && (
              <>
                {/* Payment Status */}
                <Field>
                  <FieldLabel className="text-sm text-muted-foreground">
                    Estado de Pago
                  </FieldLabel>
                  <FieldContent>
                    <p className="text-sm font-medium">
                      {isFullPayment
                        ? "Pagado Completamente"
                        : isPartialPayment
                        ? "Pago Parcial"
                        : "Pendiente"}
                    </p>
                  </FieldContent>
                </Field>

                {/* Change for Cash (if paying more than total) */}
                {isCash && change > 0 && (
                  <Field>
                    <FieldLabel className="text-sm text-muted-foreground">
                      Cambio
                    </FieldLabel>
                    <FieldContent>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(change)}
                      </p>
                    </FieldContent>
                  </Field>
                )}

                {/* Remaining amount for partial payments */}
                {isPartialPayment && (
                  <Field>
                    <FieldLabel className="text-sm text-muted-foreground">
                      Pendiente por Pagar
                    </FieldLabel>
                    <FieldContent>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(remaining)}
                      </p>
                    </FieldContent>
                  </Field>
                )}
              </>
            )}
          </div>

          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || (!isCash && amountPaidNum > total)}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Creando orden...
                </>
              ) : (
                "Terminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
