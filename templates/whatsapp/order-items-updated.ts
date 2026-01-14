export function getOrderItemsUpdatedMessage(data: {
  customerName: string;
  ticketNumber: number;
  orderType: string;
  oldTotal: number;
  newTotal: number;
  totalPaid: number;
}): string {
  const remaining = data.newTotal - data.totalPaid;
  const hasMissingPayment = remaining > 0;
  const totalInfo = `Nuevo total: *$${data.newTotal.toFixed(2)}*`;
  let paymentInfo = `Pagado: *$${data.totalPaid.toFixed(2)}*`;
  if (hasMissingPayment) {
    paymentInfo += `\nPendiente: *$${remaining.toFixed(2)}*`;
  }

  return `¡Hola ${data.customerName}!

Hemos actualizado su orden *#${data.ticketNumber}*.

Tipo: *${data.orderType}*
${totalInfo}
${paymentInfo}

Si tienes alguna pregunta, no dudes en contactarnos.

- Dan Clean`;
}
