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
import { EditableOrderItems } from "./utils/editable-order-items";
import { formatCurrency, formatDate } from "./utils/formatters";
import {
  paymentMethodLabels,
  paymentStatusLabels,
  orderStatusLabels,
} from "./utils/labels";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import { EditIcon, TrashIcon, SaveIcon, XIcon, Send } from "lucide-react";
import { translateOrderStatus } from "@/utils/translate-order-status";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrderHistoryTimeline } from "./utils/order-history-timeline";
import { Spinner } from "@/components/ui/spinner";
import {
  getOrderCreatedMessage,
  getOrderCompletedMessage,
  getOrderDeliveredMessage,
  getOrderItemsUpdatedMessage,
} from "@/templates/whatsapp";
import { useMe } from "@/hooks/useMe";
import { useQueryClient } from "@tanstack/react-query";
import { calculateIroningTotal, calculateCleaningTotal } from "@/utils";

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
  const { data: currentUser } = useMe();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customerId: "",
    orderStatus: OrderStatus.PENDING,
    paymentStatus: OrderPaymentStatus.PENDING,
    paymentMethod: OrderPaymentMethod.CASH,
    totalPaid: 0,
    ticketNumber: 0,
  });
  const [isSendingCreated, setIsSendingCreated] = useState(false);
  const [isSendingCompleted, setIsSendingCompleted] = useState(false);
  const [isSendingDelivered, setIsSendingDelivered] = useState(false);
  const [editedItems, setEditedItems] = useState<
    | { quantity: number }
    | Array<{ id?: string; item_name: string; quantity: number; price: number }>
    | null
  >(null);
  const [isSavingItems, setIsSavingItems] = useState(false);

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
      setEditedItems(null); // Reset edited items when order changes
    }
  }, [fullOrder]);

  // Use fullOrder if available, otherwise fallback to order from props
  const displayOrder = fullOrder || order;

  if (!displayOrder) return null;

  // Send WhatsApp messages
  const handleSendWhatsAppMessage = async (
    message: string,
    type: "created" | "completed" | "delivered"
  ) => {
    if (!displayOrder.customer?.phone) {
      toast.error("El cliente no tiene número de teléfono registrado");
      return;
    }

    if (!currentUser?.id) {
      toast.error("No se pudo obtener la información del usuario");
      return;
    }

    const setLoading = {
      created: setIsSendingCreated,
      completed: setIsSendingCompleted,
      delivered: setIsSendingDelivered,
    }[type];

    const messageTitles = {
      created: `Orden recibida - Nota #${displayOrder.ticketNumber}`,
      completed: `Orden completada - Nota #${displayOrder.ticketNumber}`,
      delivered: `Orden entregada - Nota #${displayOrder.ticketNumber}`,
    };

    const orderTypeText =
      displayOrder.type === OrderType.IRONING ? "Planchado" : "Lavado";
    const contextMessage = `Orden #${displayOrder.orderNumber} (${orderTypeText})`;

    setLoading(true);
    try {
      // Clean phone number (remove +, spaces, dashes, etc.)
      const cleanPhone = displayOrder.customer.phone.replace(/[\s+\-()]/g, "");

      await apiClient.post("/whatsapp/send-msg", {
        to: cleanPhone,
        message,
      });

      // Create success notification
      try {
        await apiClient.post("/notifications", {
          title: messageTitles[type],
          message: `Mensaje de WhatsApp enviado correctamente. ${contextMessage}`,
          type: "SUCCESS",
        });
      } catch (notifError) {
        // Silently fail notification creation to not break the flow
        console.error("Failed to create notification:", notifError);
      }

      // Invalidate notifications to refresh
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });

      toast.success("Mensaje de WhatsApp enviado correctamente");
    } catch (error: unknown) {
      console.error("Error sending WhatsApp message:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;

      // Create error notification
      try {
        await apiClient.post("/notifications", {
          title: messageTitles[type],
          message: `Error al enviar mensaje de WhatsApp: ${
            errorMessage || "Error desconocido"
          }. ${contextMessage}`,
          type: "ERROR",
        });
        // Invalidate notifications to refresh
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread-count"],
        });
      } catch (notifError) {
        // Silently fail notification creation to not break the flow
        console.error("Failed to create notification:", notifError);
      }

      toast.error(errorMessage || "Error al enviar mensaje de WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOrderCreated = () => {
    if (!displayOrder) return;
    const orderTypeText =
      displayOrder.type === OrderType.IRONING ? "Planchado" : "Tintorería";
    const message = getOrderCreatedMessage({
      customerName: displayOrder.customer.name,
      orderNumber: displayOrder.orderNumber,
      orderType: orderTypeText,
      total: displayOrder.total,
      totalPaid: displayOrder.totalPaid,
      ticketNumber: displayOrder.ticketNumber,
    });
    handleSendWhatsAppMessage(message, "created");
  };

  const handleSendOrderCompleted = () => {
    if (!displayOrder) return;
    const orderTypeText =
      displayOrder.type === OrderType.IRONING ? "Planchado" : "Lavado";
    const message = getOrderCompletedMessage({
      customerName: displayOrder.customer.name,
      orderNumber: displayOrder.orderNumber,
      orderType: orderTypeText,
      ticketNumber: displayOrder.ticketNumber,
    });
    handleSendWhatsAppMessage(message, "completed");
  };

  const handleSendOrderDelivered = () => {
    if (!displayOrder) return;
    const orderTypeText =
      displayOrder.type === OrderType.IRONING ? "Planchado" : "Lavado";
    const message = getOrderDeliveredMessage({
      customerName: displayOrder.customer.name,
      orderNumber: displayOrder.orderNumber,
      orderType: orderTypeText,
      ticketNumber: displayOrder.ticketNumber,
    });
    handleSendWhatsAppMessage(message, "delivered");
  };

  const handleSaveItems = async () => {
    if (!displayOrder || !editedItems) return;

    setIsSavingItems(true);
    try {
      // Store old total before update
      const oldTotal = displayOrder.total;

      // Update order items
      const updatedOrderResponse = await apiClient.patch(
        `/orders/${displayOrder.id}/items`,
        {
          items: editedItems,
        }
      );

      const updatedOrder = updatedOrderResponse.data;
      const newTotal = updatedOrder.total;

      // Send WhatsApp message if customer has phone number
      if (displayOrder.customer?.phone && currentUser?.id) {
        try {
          const orderTypeText =
            displayOrder.type === OrderType.IRONING
              ? "Planchado"
              : "Tintorería";
          const message = getOrderItemsUpdatedMessage({
            customerName: displayOrder.customer.name,
            ticketNumber: displayOrder.ticketNumber,
            orderType: orderTypeText,
            oldTotal,
            newTotal,
            totalPaid: displayOrder.totalPaid,
          });

          // Clean phone number (remove +, spaces, dashes, etc.)
          const cleanPhone = displayOrder.customer.phone.replace(
            /[\s+\-()]/g,
            ""
          );

          await apiClient.post("/whatsapp/send-msg", {
            to: cleanPhone,
            message,
          });

          // Create success notification
          try {
            await apiClient.post("/notifications", {
              title: `Items actualizados - Nota #${displayOrder.ticketNumber}`,
              message: `Mensaje de WhatsApp enviado correctamente. Orden #${displayOrder.orderNumber} (${orderTypeText})`,
              type: "SUCCESS",
            });
          } catch (notifError) {
            // Silently fail notification creation to not break the flow
            console.error("Failed to create notification:", notifError);
          }

          // Invalidate notifications to refresh
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({
            queryKey: ["notifications", "unread-count"],
          });
        } catch (whatsappError: unknown) {
          console.error("Error sending WhatsApp message:", whatsappError);
          const errorMessage =
            whatsappError &&
            typeof whatsappError === "object" &&
            "response" in whatsappError
              ? (
                  whatsappError as {
                    response?: { data?: { error?: string } };
                  }
                ).response?.data?.error
              : undefined;

          // Create error notification
          try {
            await apiClient.post("/notifications", {
              title: `Items actualizados - Nota #${displayOrder.ticketNumber}`,
              message: `Error al enviar mensaje de WhatsApp: ${
                errorMessage || "Error desconocido"
              }. Orden #${displayOrder.orderNumber}`,
              type: "ERROR",
            });
            // Invalidate notifications to refresh
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({
              queryKey: ["notifications", "unread-count"],
            });
          } catch (notifError) {
            // Silently fail notification creation to not break the flow
            console.error("Failed to create notification:", notifError);
          }
        }
      }

      toast.success("Prendas actualizadas correctamente");
      setFullOrder(updatedOrder);
      setEditedItems(null);
      onOrderUpdated?.(updatedOrder);
    } catch (error: unknown) {
      console.error("Error updating order items:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Error al actualizar los items de la orden");
    } finally {
      setIsSavingItems(false);
    }
  };

  const handleSave = async () => {
    if (!displayOrder) return;

    setIsSaving(true);
    try {
      // Update order with new customer if changed
      // Set silent: true to prevent WhatsApp notifications when editing from drawer
      const updatedOrderResponse = await apiClient.patch(
        `/orders/${displayOrder.id}`,
        {
          customerId: formData.customerId,
          status: formData.orderStatus,
          paymentStatus: formData.paymentStatus,
          paymentMethod: formData.paymentMethod,
          totalPaid: formData.totalPaid,
          ticketNumber: formData.ticketNumber,
          timestamp: displayOrder.timestamp,
          silent: true, // Silent edit - no WhatsApp notifications
        }
      );

      toast.success("Orden actualizada correctamente");
      setIsEditing(false);
      setFullOrder(updatedOrderResponse.data);
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
                      Número de Nota
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

              {/* Items - Editable when editing */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Piezas</h3>
                  {isEditing && editedItems && (
                    <Button
                      onClick={handleSaveItems}
                      disabled={isSavingItems}
                      size="sm"
                    >
                      {isSavingItems ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <SaveIcon className="h-4 w-4 mr-2" />
                          Guardar cambios
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <EditableOrderItems
                  order={displayOrder}
                  isEditing={isEditing}
                  onItemsChange={setEditedItems}
                />
                {isEditing && editedItems && (
                  <div className="flex justify-end pt-2 border-t">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Nuevo total:
                      </p>
                      <p className="text-lg font-bold">
                        {displayOrder.type === OrderType.IRONING
                          ? formatCurrency(
                              calculateIroningTotal(
                                (editedItems as { quantity: number }).quantity
                              )
                            )
                          : formatCurrency(
                              calculateCleaningTotal(
                                editedItems as Array<{
                                  item_name: string;
                                  quantity: number;
                                  price: number;
                                }>
                              )
                            )}
                      </p>
                    </div>
                  </div>
                )}
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
                          <p className="font-medium uppercase">
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
                          <p className="font-medium uppercase">
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

              {/* WhatsApp Messages */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">
                  Reenviar Mensajes de WhatsApp
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={handleSendOrderCreated}
                    disabled={isSendingCreated || !displayOrder.customer?.phone}
                    className="w-full justify-start"
                  >
                    {isSendingCreated ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Reenviar: Orden Recibida
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSendOrderCompleted}
                    disabled={
                      isSendingCompleted || !displayOrder.customer?.phone
                    }
                    className="w-full justify-start"
                  >
                    {isSendingCompleted ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Reenviar: Orden Completada
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSendOrderDelivered}
                    disabled={
                      isSendingDelivered || !displayOrder.customer?.phone
                    }
                    className="w-full justify-start"
                  >
                    {isSendingDelivered ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Reenviar: Orden Entregada
                      </>
                    )}
                  </Button>
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
                onClick={() => {
                  handleCancel();
                  setEditedItems(null);
                }}
                disabled={isSaving || isSavingItems}
                className="flex-1 sm:flex-initial"
              >
                <XIcon className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              {editedItems && (
                <Button
                  onClick={handleSaveItems}
                  disabled={isSavingItems}
                  variant="secondary"
                  className="flex-1 sm:flex-initial"
                >
                  {isSavingItems ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Guardando items...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Guardar items
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving || isSavingItems}
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
                onClick={() => {
                  setIsEditing(true);
                  // Initialize edited items based on current order
                  if (displayOrder.type === OrderType.IRONING) {
                    const item = displayOrder.items as {
                      quantity: number;
                    } | null;
                    setEditedItems(
                      item ? { quantity: item.quantity } : { quantity: 1 }
                    );
                  } else {
                    const items = Array.isArray(displayOrder.items)
                      ? (displayOrder.items as Array<{
                          id: string;
                          item_name: string;
                          quantity: number;
                          total: number;
                        }>)
                      : [];
                    setEditedItems(
                      items.map((item) => ({
                        id: item.id,
                        item_name: item.item_name,
                        quantity: item.quantity,
                        price: item.total / item.quantity,
                      }))
                    );
                  }
                }}
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
