"use client";

import { useOrderForm } from "@/components/pages/pos/order-form";
import { OrderType, OrderPaymentMethod } from "@/types/order";
import { Separator } from "@/components/ui/separator";

const paymentMethodLabels: Record<OrderPaymentMethod, string> = {
  [OrderPaymentMethod.CASH]: "Efectivo",
  [OrderPaymentMethod.CARD]: "Tarjeta",
  [OrderPaymentMethod.TRANSFER]: "Transferencia",
};

export const SummaryComponent = () => {
  const { formData, calculateTotal } = useOrderForm();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-5 lg:p-6 h-full">
      <h1 className="text-base md:text-lg font-bold mb-3 md:mb-4">Resumen</h1>
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Customer Info */}
        {formData.customer && (
          <div className="flex flex-col gap-1.5 md:gap-2">
            <h2 className="text-xs sm:text-sm font-medium text-muted-foreground">
              Cliente
            </h2>
            <p className="text-xs sm:text-sm">
              {formData.customer.name} {formData.customer.lastName}
            </p>
          </div>
        )}

        {/* Order Type */}
        {formData.type && (
          <>
            <Separator />
            <div className="flex flex-col gap-1.5 md:gap-2">
              <h2 className="text-xs sm:text-sm font-medium text-muted-foreground">
                Tipo de Orden
              </h2>
              <p className="text-xs sm:text-sm">
                {formData.type === OrderType.IRONING
                  ? "Planchado"
                  : "Tintoreria"}
              </p>
            </div>
          </>
        )}

        {/* Items */}
        {formData.type === OrderType.IRONING && formData.ironingQuantity && (
          <>
            <Separator />
            <div className="flex flex-col gap-1.5 md:gap-2">
              <h2 className="text-xs sm:text-sm font-medium text-muted-foreground">
                Cantidad
              </h2>
              <p className="text-xs sm:text-sm">
                {formData.ironingQuantity} unidades
              </p>
            </div>
          </>
        )}

        {formData.type === OrderType.CLEANING &&
          formData.cleaningItems.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-1.5 md:gap-2">
                <h2 className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Prendas
                </h2>
                <div className="flex flex-col gap-1">
                  {formData.cleaningItems.map((item, index) => (
                    <p key={index} className="text-xs sm:text-sm">
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
            <div className="flex flex-col gap-1.5 md:gap-2">
              <h2 className="text-xs sm:text-sm font-medium text-muted-foreground">
                Método de Pago
              </h2>
              <p className="text-xs sm:text-sm">
                {paymentMethodLabels[formData.paymentMethod]}
              </p>
            </div>
          </>
        )}

        {/* Total */}
        {formData.type && (
          <>
            <Separator />
            <div className="flex flex-col gap-1.5 md:gap-2">
              <h2 className="text-xs sm:text-sm font-medium">Total</h2>
              <p className="text-base sm:text-lg font-bold">
                {formatCurrency(calculateTotal())}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
