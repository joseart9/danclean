export function getOrderCreatedMessage(data: {
  customerName: string;
  orderNumber: number;
  orderType: string;
  total: number;
  totalPaid: number;
}): string {
  const remaining = data.total - data.totalPaid;
  const hasMissingPayment = remaining > 0;

  let paymentInfo = `Pagado: $${data.totalPaid.toFixed(2)}`;
  if (hasMissingPayment) {
    paymentInfo += `\nPendiente: $${remaining.toFixed(2)}`;
  }

  return `¡Hola ${data.customerName}!

Tu orden #${data.orderNumber} ha sido creada exitosamente.

Tipo: ${data.orderType}
Total: $${data.total.toFixed(2)}
${paymentInfo}

Gracias por confiar en nosotros. Te notificaremos cuando tu orden esté lista.

- Dan Clean`;
}
