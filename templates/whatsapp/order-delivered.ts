export function getOrderDeliveredMessage(data: {
  customerName: string;
  orderNumber: number;
  orderType: string;
  ticketNumber: number;
}): string {
  return `¡Hola ${data.customerName}!

Tu orden #${data.ticketNumber} (${data.orderType}) ha sido entregada exitosamente.

Esperamos que estés satisfecho con nuestro servicio. ¡Gracias por elegir Dan Clean!

- Dan Clean`;
}
