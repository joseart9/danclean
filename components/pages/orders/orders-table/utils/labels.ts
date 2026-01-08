import {
  OrderPaymentStatus,
  OrderPaymentMethod,
  OrderStatus,
} from "@/types/order";

export const paymentMethodLabels: Record<OrderPaymentMethod, string> = {
  [OrderPaymentMethod.CASH]: "Efectivo",
  [OrderPaymentMethod.CARD]: "Tarjeta",
  [OrderPaymentMethod.TRANSFER]: "Transferencia",
};

export const paymentStatusLabels: Record<OrderPaymentStatus, string> = {
  [OrderPaymentStatus.PENDING]: "Pendiente",
  [OrderPaymentStatus.PAID]: "Pagado",
  [OrderPaymentStatus.PARTIALLY_PAID]: "Pago Parcial",
  [OrderPaymentStatus.CANCELLED]: "Cancelado",
  [OrderPaymentStatus.REFUNDED]: "Reembolsado",
};

export const orderStatusLabels: Record<
  Exclude<OrderStatus, "DELIVERED">,
  string
> = {
  [OrderStatus.PENDING]: "Pendiente",
  [OrderStatus.COMPLETED]: "Completado",
  [OrderStatus.CANCELLED]: "Cancelado",
  [OrderStatus.DAMAGED]: "Dañado",
  [OrderStatus.LOST]: "Perdido",
};
