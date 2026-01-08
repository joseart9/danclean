"use client";

import { useOrderForm } from "@/components/pages/pos/order-form";
import { OrderType } from "@/types/order";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/utils/format-currency";
import { paymentMethodLabels } from "@/constants/payment-method";

export const SummaryComponent = () => {
  const { formData, calculateTotal } = useOrderForm();

  return (
    <div className="bg-card rounded-lg p-4 h-full flex flex-col gap-4 overflow-y-auto">
      {/* Customer Info */}
      {formData.customer && (
        <div className="flex flex-row justify-between items-center">
          <h2 className="text-sm font-medium text-muted-foreground">Cliente</h2>
          <p className="text-sm">
            {formData.customer.name} {formData.customer.lastName}
          </p>
        </div>
      )}

      {/* Order Type */}
      {formData.type && (
        <>
          <Separator />
          <div className="flex flex-row justify-between items-center">
            <h2 className="text-sm font-medium text-muted-foreground">
              Tipo de Orden
            </h2>
            <p className="text-sm uppercase">
              {formData.type === OrderType.IRONING ? "Planchado" : "Tintoreria"}
            </p>
          </div>
        </>
      )}

      {/* Items */}
      {formData.type === OrderType.IRONING && formData.ironingQuantity && (
        <>
          <Separator />
          <div className="flex flex-row justify-between items-center">
            <h2 className="text-sm font-medium text-muted-foreground">
              Cantidad
            </h2>
            <p className="text-sm">{formData.ironingQuantity} unidades</p>
          </div>
        </>
      )}

      {formData.type === OrderType.CLEANING &&
        formData.cleaningItems.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-row justify-between items-center">
              <h2 className="text-sm font-medium text-muted-foreground">
                Prendas
              </h2>
              <div className="flex flex-col gap-1">
                {formData.cleaningItems.map((item, index) => (
                  <p key={index} className="text-sm">
                    {item.item_name}: {item.quantity} unidades
                  </p>
                ))}
              </div>
            </div>
          </>
        )}

      {/* Payment Method */}
      {formData.paymentMethod && (
        <>
          <Separator />
          <div className="flex flex-row justify-between items-center">
            <h2 className="text-sm font-medium text-muted-foreground">
              Método de Pago
            </h2>
            <p className="text-sm uppercase">
              {paymentMethodLabels[formData.paymentMethod]}
            </p>
          </div>
        </>
      )}

      {/* Total */}
      {formData.type && (
        <>
          <Separator />
          <div className="flex flex-row justify-between items-center">
            <h2 className="text-sm font-medium text-muted-foreground">Total</h2>
            <p className="text-sm font-bold">
              {formatCurrency(calculateTotal())}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
