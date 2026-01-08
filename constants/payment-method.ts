import { OrderPaymentMethod } from "@/types/order";

export const paymentMethodLabels: Record<OrderPaymentMethod, string> = {
  [OrderPaymentMethod.CASH]: "Efectivo",
  [OrderPaymentMethod.CARD]: "Tarjeta",
  [OrderPaymentMethod.TRANSFER]: "Transferencia",
};
