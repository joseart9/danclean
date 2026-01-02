"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import type { FullOrder } from "@/types/order";
import type { Customer } from "@/types/customer";
import { CustomerCombobox } from "@/components/pages/pos/order-form/customer-combobox";

interface OrderSearchFormProps {
  onOrderFound: (order: FullOrder) => void;
}

export function OrderSearchForm({ onOrderFound }: OrderSearchFormProps) {
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("order-number");

  const handleSearchByOrderNumber = async () => {
    if (!orderNumber.trim()) {
      toast.error("Por favor ingresa un número de orden");
      return;
    }

    const orderNumberInt = parseInt(orderNumber, 10);
    if (isNaN(orderNumberInt) || orderNumberInt <= 0) {
      toast.error("Por favor ingresa un número de orden válido");
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.get<FullOrder>("/orders", {
        params: {
          order_number: orderNumberInt,
        },
      });

      onOrderFound(response.data);
      toast.success("Orden encontrada");
    } catch (error: unknown) {
      console.error("Error searching order:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "No se encontró la orden");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchByCustomer = async () => {
    if (!selectedCustomer) {
      toast.error("Por favor selecciona un cliente");
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.get<FullOrder[]>("/orders", {
        params: {
          customer_id: selectedCustomer.id,
          exclude_delivered: "true",
        },
      });

      const orders = response.data;

      if (orders.length === 0) {
        toast.error("No se encontraron órdenes pendientes para este cliente");
        return;
      }

      // If multiple orders found, use the first one (most recent)
      if (orders.length > 1) {
        toast.success(
          `Se encontraron ${orders.length} órdenes. Mostrando la más reciente.`
        );
      }

      onOrderFound(orders[0]);
      toast.success("Orden encontrada");
    } catch (error: unknown) {
      console.error("Error searching orders:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "No se encontraron órdenes");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (activeTab === "order-number") {
        handleSearchByOrderNumber();
      } else {
        handleSearchByCustomer();
      }
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="order-number">Número de Orden</TabsTrigger>
        <TabsTrigger value="customer">Cliente</TabsTrigger>
      </TabsList>

      <TabsContent value="order-number" className="space-y-4">
        <div className="flex w-full gap-2">
          <Input
            type="number"
            placeholder="Número de orden"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSearching}
            className="w-full"
          />
          <Button onClick={handleSearchByOrderNumber} disabled={isSearching}>
            {isSearching ? (
              <>
                <Spinner />
                Buscando...
              </>
            ) : (
              "Buscar orden"
            )}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="customer" className="space-y-4">
        <div className="flex gap-2 w-full">
          <div className="w-full">
            <CustomerCombobox
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
            />
          </div>
          <Button
            onClick={handleSearchByCustomer}
            disabled={isSearching || !selectedCustomer}
          >
            {isSearching ? (
              <>
                <Spinner />
                Buscando...
              </>
            ) : (
              "Buscar orden"
            )}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
