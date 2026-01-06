export function getOrderCompletedMessage(data: {
  customerName: string;
  orderNumber: number;
  orderType: string;
}): string {
  return `¡Hola ${data.customerName}!

Tu orden #${data.orderNumber} (${data.orderType}) está lista para ser recogida.

Puedes pasar a recogerla cuando te sea conveniente.

¡Gracias por tu paciencia!

- Dan Clean`;
}
