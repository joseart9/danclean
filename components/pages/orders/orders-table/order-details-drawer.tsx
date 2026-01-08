"use client";

import { useState, useEffect } from "react";
import type { FullOrder } from "@/types/order";
import type { Customer } from "@/types/customer";
import {
  OrderType,
  OrderPaymentStatus,
  OrderPaymentMethod,
  OrderStatus,
} from "@/types/order";
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { CustomerCombobox } from "@/components/pages/pos/order-form";
import { OrderItemsDisplay } from "./utils/order-items";
import { formatCurrency, formatDate } from "./utils/formatters";
import {
  paymentMethodLabels,
  paymentStatusLabels,
  orderStatusLabels,
} from "./utils/labels";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import { EditIcon, TrashIcon, SaveIcon, XIcon } from "lucide-react";
import { translateOrderStatus } from "@/utils/translate-order-status";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrderHistoryTimeline } from "./utils/order-history-timeline";

interface OrderDetailsDrawerProps {
  order: FullOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: (order: FullOrder) => void;
}

export function OrderDetailsDrawer({
  order,
  open,
  onOpenChange,
  onOrderUpdated,
}: OrderDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullOrder, setFullOrder] = useState<FullOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [formData, setFormData] = useState({
    customerId: "",
    orderStatus: OrderStatus.PENDING,
    paymentStatus: OrderPaymentStatus.PENDING,
    paymentMethod: OrderPaymentMethod.CASH,
    totalPaid: 0,
    ticketNumber: 0,
  });

  // Fetch full order details when drawer opens
  useEffect(() => {
    if (open && order) {
      setIsLoadingOrder(true);
      apiClient
        .get<FullOrder>(`/orders/${order.id}`)
        .then((response) => {
          setFullOrder(response.data);
          setSelectedCustomer(response.data.customer);
          setFormData({
            customerId: response.data.customer.id,
            orderStatus: response.data.status,
            paymentStatus: response.data.paymentStatus,
            paymentMethod: response.data.paymentMethod,
            totalPaid: response.data.totalPaid,
            ticketNumber: response.data.ticketNumber,
          });
        })
        .catch((error) => {
          console.error("Error fetching order details:", error);
          toast.error("Error al cargar los detalles de la orden");
          // Fallback to the order from props
          setFullOrder(order);
        })
        .finally(() => {
          setIsLoadingOrder(false);
        });
    } else if (!open) {
      // Reset when drawer closes
      setFullOrder(null);
      setIsEditing(false);
    }
  }, [open, order]);

  // Initialize form data when fullOrder changes
  useEffect(() => {
    if (fullOrder) {
      setSelectedCustomer(fullOrder.customer);
      setFormData({
        customerId: fullOrder.customer.id,
        orderStatus: fullOrder.status,
        paymentStatus: fullOrder.paymentStatus,
        paymentMethod: fullOrder.paymentMethod,
        totalPaid: fullOrder.totalPaid,
        ticketNumber: fullOrder.ticketNumber,
      });
      setIsEditing(false);
    }
  }, [fullOrder]);

  // Use fullOrder if available, otherwise fallback to order from props
  const displayOrder = fullOrder || order;

  if (!displayOrder) return null;

  const handleSave = async () => {
    if (!displayOrder) return;

    setIsSaving(true);
    try {
      // Update order with new customer if changed
      const updatedOrderResponse = await apiClient.patch(
        `/orders/${displayOrder.id}`,
        {
          customerId: formData.customerId,
          status: formData.orderStatus,
          paymentStatus: formData.paymentStatus,
          paymentMethod: formData.paymentMethod,
          totalPaid: formData.totalPaid,
          ticketNumber: formData.ticketNumber,
        }
      );

      toast.success("Orden actualizada correctamente");
      setIsEditing(false);
      onOrderUpdated?.(updatedOrderResponse.data);
    } catch (error: unknown) {
      console.error("Error updating order:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al actualizar la orden");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (displayOrder) {
      setSelectedCustomer(displayOrder.customer);
      setFormData({
        customerId: displayOrder.customer.id,
        orderStatus: displayOrder.status,
        paymentStatus: displayOrder.paymentStatus,
        paymentMethod: displayOrder.paymentMethod,
        totalPaid: displayOrder.totalPaid,
        ticketNumber: displayOrder.ticketNumber,
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (
      !displayOrder ||
      !confirm("¿Estás seguro de que deseas eliminar esta orden?")
    )
      return;

    try {
      await apiClient.delete(`/orders/${displayOrder.id}`);
      toast.success("Orden eliminada correctamente");
      onOpenChange(false);
      onOrderUpdated?.(displayOrder); // Trigger refresh
    } catch (error: unknown) {
      console.error("Error deleting order:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al eliminar la orden");
    }
  };

  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setFormData({ ...formData, customerId: customer.id });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg p-4">
        <Tabs defaultValue="resumen" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="mt-0">
            <div className="flex flex-col gap-6 py-4">
              {/* Información de la Orden - Order Number */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">
                  Información de la Orden
                </h3>
                <div className="space-y-3 flex flex-row gap-3">
                  <Field>
                    <FieldLabel className="text-sm text-muted-foreground">
                      Número de Orden
                    </FieldLabel>
                    <FieldContent>
                      <p className="font-medium text-lg">
                        {displayOrder.orderNumber}
                      </p>
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldLabel className="text-sm text-muted-foreground">
                      Número de Ticket
                    </FieldLabel>
                    <FieldContent>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          value={formData.ticketNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ticketNumber: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      ) : (
                        <p className="font-medium text-lg">
                          {displayOrder.ticketNumber.toLocaleString()}
                        </p>
                      )}
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldLabel className="text-sm text-muted-foreground">
                      Servicio
                    </FieldLabel>
                    <FieldContent>
                      <p className="font-medium">
                        {displayOrder.type === OrderType.IRONING
                          ? "PLANCHA"
                          : "TINTORERIA"}
                      </p>
                    </FieldContent>
                  </Field>
                </div>
                <Field>
                  <FieldLabel className="text-sm text-muted-foreground">
                    Fecha de emisión
                  </FieldLabel>
                  <FieldContent>
                    <p className="font-medium">
                      {formatDate(displayOrder.timestamp)}
                    </p>
                  </FieldContent>
                </Field>
              </div>

              <Separator />

              {/* Información del Cliente */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Cliente</h3>
                <Field>
                  <FieldContent>
                    {isEditing ? (
                      <CustomerCombobox
                        value={selectedCustomer}
                        onValueChange={handleCustomerChange}
                      />
                    ) : (
                      <div className="space-y-2">
                        <p className="font-medium text-muted-foreground">
                          {displayOrder.customer.name}{" "}
                          {displayOrder.customer.lastName}
                        </p>
                        {displayOrder.customer.address && (
                          <p className="text-sm text-muted-foreground">
                            Dirección: {displayOrder.customer.address}
                          </p>
                        )}
                      </div>
                    )}
                  </FieldContent>
                </Field>
              </div>

              <Separator />

              {/* Estado de la Orden */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Estado de la Orden</h3>
                <div className="space-y-3 flex flex-row gap-3">
                  <Field>
                    <FieldLabel className="text-sm text-muted-foreground">
                      Estatus
                    </FieldLabel>
                    <FieldContent>
                      {isEditing ? (
                        <Select
                          value={formData.orderStatus}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              orderStatus: value as OrderStatus,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(orderStatusLabels).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant={
                            displayOrder.status === OrderStatus.DELIVERED
                              ? "success"
                              : displayOrder.status === OrderStatus.COMPLETED
                              ? "warning"
                              : displayOrder.status === OrderStatus.CANCELLED ||
                                displayOrder.status === OrderStatus.DAMAGED ||
                                displayOrder.status === OrderStatus.LOST ||
                                displayOrder.status === OrderStatus.PENDING
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {translateOrderStatus(displayOrder.status)}
                        </Badge>
                      )}
                    </FieldContent>
                  </Field>
                  {displayOrder.storage && (
                    <Field>
                      <FieldLabel className="text-sm text-muted-foreground">
                        Almacén
                      </FieldLabel>
                      <FieldContent>
                        <p className="font-medium">
                          Almacén #{displayOrder.storage.storageNumber}
                        </p>
                      </FieldContent>
                    </Field>
                  )}
                </div>
              </div>

              <Separator />

              {/* Items - Display only */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Piezas</h3>
                <OrderItemsDisplay order={displayOrder} />
              </div>

              <Separator />

              {/* Información de Pago */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Información de Pago</h3>
                <div className="space-y-6">
                  <div className="flex flex-col gap-6">
                    <Field>
                      <FieldLabel className="text-sm text-muted-foreground">
                        Método de Pago
                      </FieldLabel>
                      <FieldContent>
                        {isEditing ? (
                          <Select
                            value={formData.paymentMethod}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                paymentMethod: value as OrderPaymentMethod,
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(paymentMethodLabels).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-medium">
                            {paymentMethodLabels[displayOrder.paymentMethod]}
                          </p>
                        )}
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel className="text-sm text-muted-foreground">
                        Estado de Pago
                      </FieldLabel>
                      <FieldContent>
                        {isEditing ? (
                          <Select
                            value={formData.paymentStatus}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                paymentStatus: value as OrderPaymentStatus,
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(paymentStatusLabels).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-medium">
                            {paymentStatusLabels[displayOrder.paymentStatus]}
                          </p>
                        )}
                      </FieldContent>
                    </Field>
                  </div>

                  <div className="flex flex-row gap-3">
                    <Field>
                      <FieldLabel className="text-sm text-muted-foreground">
                        Total
                      </FieldLabel>
                      <FieldContent>
                        <p className="text-lg font-bold">
                          {formatCurrency(displayOrder.total)}
                        </p>
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel className="text-sm text-muted-foreground">
                        Total Pagado
                      </FieldLabel>
                      <FieldContent>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.totalPaid}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                totalPaid: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                          />
                        ) : (
                          <p className="text-lg font-bold">
                            {formatCurrency(displayOrder.totalPaid)}
                          </p>
                        )}
                      </FieldContent>
                    </Field>
                    {formData.totalPaid < displayOrder.total && (
                      <Field>
                        <FieldLabel className="text-sm text-muted-foreground">
                          Pendiente
                        </FieldLabel>
                        <FieldContent>
                          <p className="text-lg font-bold text-orange-600">
                            {formatCurrency(
                              displayOrder.total - formData.totalPaid
                            )}
                          </p>
                        </FieldContent>
                      </Field>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Metadatos - Display only */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Metadatos</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Fecha de Creación
                    </p>
                    <p className="font-medium">
                      {formatDate(displayOrder.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Última Actualización
                    </p>
                    <p className="font-medium">
                      {formatDate(displayOrder.updatedAt)}
                    </p>
                  </div>
                  {displayOrder.user && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Creado por
                      </p>
                      <p className="font-medium">
                        {displayOrder.user.name} {displayOrder.user.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historial" className="mt-0">
            <div className="flex flex-col gap-6 py-4">
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">
                  Historial de Modificaciones
                </h3>
                {isLoadingOrder ? (
                  <p className="text-sm text-muted-foreground">
                    Cargando historial...
                  </p>
                ) : displayOrder.orderHistory &&
                  displayOrder.orderHistory.length > 0 ? (
                  <OrderHistoryTimeline
                    orderHistory={displayOrder.orderHistory}
                    currentOrder={displayOrder}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay historial de modificaciones para esta orden.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="flex flex-row gap-2 sm:justify-end mt-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 sm:flex-initial"
              >
                <XIcon className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 sm:flex-initial"
              >
                <SaveIcon className="mr-2 h-4 w-4" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="flex-1 sm:flex-initial"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-initial"
              >
                <EditIcon className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
