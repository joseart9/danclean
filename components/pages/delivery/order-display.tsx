"use client";

import type { FullOrder } from "@/types/order";
import { OrderStatus, OrderType } from "@/types/order";
import { Separator } from "@/components/ui/separator";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { OrderItemsDisplay } from "@/components/pages/orders/orders-table/utils/order-items";
import {
  formatCurrency,
  formatDate,
} from "@/components/pages/orders/orders-table/utils/formatters";
import {
  paymentMethodLabels,
  paymentStatusLabels,
} from "@/components/pages/orders/orders-table/utils/labels";
import { Badge } from "@/components/ui/badge";
import { translateOrderStatus } from "@/utils/translate-order-status";

interface OrderDisplayProps {
  order: FullOrder;
}

export function OrderDisplay({ order }: OrderDisplayProps) {
  const remainingAmount = order.total - order.totalPaid;
  const isFullyPaid = order.totalPaid >= order.total;

  return (
    <div className="bg-card border rounded-lg p-6 space-y-6">
      {/* Ticket Number, Order Number and Storage ID - Most Important */}
      <div className="space-y-4">
        <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 text-center">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Número de Orden
              </p>
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary border-4 border-primary/20">
                <span className="text-4xl font-bold text-foreground">
                  {order.orderNumber}
                </span>
              </div>
            </div>
            {order.storage && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Estante de Almacenamiento
                  </p>
                  <div className="inline-flex items-center justify-center min-w-32 px-6 py-3 rounded-lg bg-primary border-2 border-primary/20">
                    <span className="text-2xl font-bold text-foreground">
                      {order.storage.storageNumber}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Customer Information */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Cliente</h3>
        <Field>
          <FieldLabel className="text-sm text-muted-foreground">
            Nombre
          </FieldLabel>
          <FieldContent>
            <p className="font-medium">
              {order.customer.name} {order.customer.lastName}
            </p>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel className="text-sm text-muted-foreground">
            Teléfono
          </FieldLabel>
          <FieldContent>
            <p className="font-medium">{order.customer.phone}</p>
          </FieldContent>
        </Field>
        {order.customer.address && (
          <Field>
            <FieldLabel className="text-sm text-muted-foreground">
              Dirección
            </FieldLabel>
            <FieldContent>
              <p className="font-medium">{order.customer.address}</p>
            </FieldContent>
          </Field>
        )}
      </div>

      <Separator />

      {/* Order Information */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Información de la Orden</h3>
        <Field>
          <FieldLabel className="text-sm text-muted-foreground">
            Servicio
          </FieldLabel>
          <FieldContent>
            <p className="font-medium">
              {order.type === OrderType.IRONING ? "PLANCHA" : "TINTORERIA"}
            </p>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel className="text-sm text-muted-foreground">
            Estado
          </FieldLabel>
          <FieldContent>
            <Badge
              variant={
                order.status === OrderStatus.DELIVERED
                  ? "success"
                  : order.status === OrderStatus.COMPLETED
                  ? "warning"
                  : order.status === OrderStatus.CANCELLED ||
                    order.status === OrderStatus.DAMAGED ||
                    order.status === OrderStatus.LOST ||
                    order.status === OrderStatus.PENDING
                  ? "destructive"
                  : "secondary"
              }
            >
              {translateOrderStatus(order.status)}
            </Badge>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel className="text-sm text-muted-foreground">
            Número de Nota
          </FieldLabel>
          <FieldContent>
            <p className="font-medium">{order.ticketNumber.toLocaleString()}</p>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel className="text-sm text-muted-foreground">
            Fecha de Creación
          </FieldLabel>
          <FieldContent>
            <p className="font-medium">{formatDate(order.createdAt)}</p>
          </FieldContent>
        </Field>
      </div>

      <Separator />

      {/* Order Items */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Items de la Orden</h3>
        <OrderItemsDisplay order={order} />
      </div>

      <Separator />

      {/* Payment Information */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Información de Pago</h3>
        <Field>
          <FieldLabel className="text-sm text-muted-foreground">
            Total
          </FieldLabel>
          <FieldContent>
            <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel className="text-sm text-muted-foreground">
            Pagado
          </FieldLabel>
          <FieldContent>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(order.totalPaid)}
            </p>
          </FieldContent>
        </Field>
        {!isFullyPaid && (
          <Field>
            <FieldLabel className="text-sm text-muted-foreground">
              Pendiente por Pagar
            </FieldLabel>
            <FieldContent>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(remainingAmount)}
              </p>
            </FieldContent>
          </Field>
        )}
        <Field>
          <FieldLabel className="text-sm text-muted-foreground">
            Estado de Pago
          </FieldLabel>
          <FieldContent>
            <p className="font-medium">
              {paymentStatusLabels[order.paymentStatus]}
            </p>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel className="text-sm text-muted-foreground">
            Método de Pago
          </FieldLabel>
          <FieldContent>
            <p className="font-medium uppercase">
              {paymentMethodLabels[order.paymentMethod]}
            </p>
          </FieldContent>
        </Field>
      </div>
    </div>
  );
}
