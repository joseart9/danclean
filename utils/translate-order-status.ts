import { OrderStatus } from "@/types/order";

export const translateOrderStatus = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return "PENDIENTE";
    case OrderStatus.COMPLETED:
      return "COMPLETO";
    case OrderStatus.CANCELLED:
      return "CANCELADO";
    case OrderStatus.DAMAGED:
      return "DAÑADO";
    case OrderStatus.LOST:
      return "PERDIDO";
    case OrderStatus.DELIVERED:
      return "ENTREGADO";
    default:
      return "DESCONOCIDO";
  }
};
