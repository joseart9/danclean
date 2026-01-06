export function getOrderDeliveredMessage(data: {
  customerName: string;
  orderNumber: number;
  orderType: string;
}): string {
  return `¡Hola ${data.customerName}!

Tu orden #${data.orderNumber} (${data.orderType}) ha sido entregada exitosamente.

Esperamos que estés satisfecho con nuestro servicio. ¡Gracias por elegir Dan Clean!

- Dan Clean`;
}
