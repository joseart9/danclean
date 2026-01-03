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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
} from "@/types/order";
import type { FullOrder } from "@/types/order";

interface DeliveryCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: FullOrder;
  onDeliveryCompleted: () => void;
}

const paymentMethodLabels: Record<OrderPaymentMethod, string> = {
  [OrderPaymentMethod.CASH]: "Efectivo",
  [OrderPaymentMethod.CARD]: "Tarjeta",
  [OrderPaymentMethod.TRANSFER]: "Transferencia",
};

export function DeliveryCompletionDialog({
  open,
  onOpenChange,
  order,
  onDeliveryCompleted,
}: DeliveryCompletionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [additionalPayment, setAdditionalPayment] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>(
    order.paymentMethod
  );

  const remainingAmount = order.total - order.totalPaid;
  const isFullyPaid = order.totalPaid >= order.total;
  const additionalPaymentNum = parseFloat(additionalPayment) || 0;
  const newTotalPaid = order.totalPaid + additionalPaymentNum;
  // totalPaid should never exceed order.total (even if customer overpays with cash)
  const finalTotalPaid = Math.min(newTotalPaid, order.total);
  const isCash = paymentMethod === OrderPaymentMethod.CASH;
  const change =
    isCash && newTotalPaid > order.total ? newTotalPaid - order.total : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentStatus = (): OrderPaymentStatus => {
    if (newTotalPaid >= order.total) {
      return OrderPaymentStatus.PAID;
    } else if (newTotalPaid > order.totalPaid) {
      return OrderPaymentStatus.PARTIALLY_PAID;
    } else {
      return order.paymentStatus;
    }
  };

  const handleSubmit = async () => {
    // If order is not fully paid, validate additional payment
    if (!isFullyPaid) {
      if (additionalPaymentNum <= 0) {
        toast.error("Por favor ingresa el monto adicional a pagar");
        return;
      }

      // For cash payments, allow overpayment (will calculate change)
      // For other payment methods, don't allow overpayment
      if (!isCash && additionalPaymentNum > remainingAmount) {
        toast.error(
          `El monto adicional no puede exceder el pendiente: ${formatCurrency(
            remainingAmount
          )}`
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      const paymentStatus = getPaymentStatus();

      // Prepare update data
      // paid should be the actual amount applied to the order (after accounting for change)
      // not the amount the customer gave
      const actualAmountPaid = finalTotalPaid - order.totalPaid;

      const updateData: {
        status: OrderStatus;
        totalPaid: number;
        paid: number;
        paymentStatus: OrderPaymentStatus;
        paymentMethod?: OrderPaymentMethod;
      } = {
        status: OrderStatus.DELIVERED,
        totalPaid: finalTotalPaid,
        paid: actualAmountPaid,
        paymentStatus,
      };

      // Only update payment method if there's an additional payment
      if (!isFullyPaid && additionalPaymentNum > 0) {
        updateData.paymentMethod = paymentMethod;
      }

      // Update order: set status to DELIVERED, update totalPaid, and payment status
      await apiClient.patch(`/orders/${order.id}`, updateData);

      toast.success("Orden entregada correctamente");
      onDeliveryCompleted();
      setAdditionalPayment("");
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error completing delivery:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al completar la entrega");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Terminar Entrega</DialogTitle>
          <DialogDescription>
            {!isFullyPaid
              ? "Registra el pago adicional antes de completar la entrega"
              : "Confirma la entrega de la orden"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Information Summary */}
          <Field>
            <FieldLabel className="text-sm text-muted-foreground">
              Total de la Orden
            </FieldLabel>
            <FieldContent>
              <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel className="text-sm text-muted-foreground">
              Ya Pagado
            </FieldLabel>
            <FieldContent>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(order.totalPaid)}
              </p>
            </FieldContent>
          </Field>

          {!isFullyPaid && (
            <>
              <Field>
                <FieldLabel className="text-sm text-muted-foreground">
                  Pendiente por Pagar
                </FieldLabel>
                <FieldContent>
                  <p className="text-lg font-bold text-orange-600">
                    {formatCurrency(remainingAmount)}
                  </p>
                </FieldContent>
              </Field>

              {/* Additional Payment Amount */}
              <Field>
                <FieldLabel required className="text-sm text-muted-foreground">
                  Monto Adicional a Pagar
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    placeholder="0"
                    value={additionalPayment}
                    onChange={(e) => setAdditionalPayment(e.target.value)}
                    min={0}
                    step="0.01"
                  />
                </FieldContent>
              </Field>

              {/* Payment Method Selection */}
              <Field>
                <FieldLabel required className="text-sm text-muted-foreground">
                  Método de Pago
                </FieldLabel>
                <FieldContent>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) =>
                      setPaymentMethod(value as OrderPaymentMethod)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paymentMethodLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              {/* New Total Paid Preview */}
              {additionalPaymentNum > 0 && (
                <Field>
                  <FieldLabel className="text-sm text-muted-foreground">
                    Total Pagado (Nuevo)
                  </FieldLabel>
                  <FieldContent>
                    <p className="text-lg font-bold">
                      {formatCurrency(finalTotalPaid)}
                    </p>
                    {finalTotalPaid < order.total && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Pendiente:{" "}
                        {formatCurrency(order.total - finalTotalPaid)}
                      </p>
                    )}
                    {finalTotalPaid >= order.total && (
                      <p className="text-xs text-green-600 mt-1">
                        Orden completamente pagada
                      </p>
                    )}
                  </FieldContent>
                </Field>
              )}

              {/* Change for Cash Payments */}
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
            </>
          )}
        </div>

        <DialogFooter>
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
            disabled={isLoading || (!isFullyPaid && additionalPaymentNum <= 0)}
          >
            {isLoading ? (
              <>
                <Spinner />
                Procesando...
              </>
            ) : (
              "Terminar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
