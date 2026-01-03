"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Customer } from "@/types/customer";
import { OrderType, OrderPaymentMethod } from "@/types/order";
import { calculateIroningTotal, calculateCleaningTotal } from "@/utils";

export interface CleaningItem {
  id: string;
  item_name: string;
  quantity: number;
  price: number;
}

export interface OrderFormData {
  customer: Customer | null;
  type: OrderType | null;
  ironingQuantity: number | null;
  cleaningItems: CleaningItem[];
  paymentMethod: OrderPaymentMethod | null;
}

interface OrderFormContextType {
  formData: OrderFormData;
  setCustomer: (customer: Customer | null) => void;
  setOrderType: (type: OrderType | null) => void;
  setIroningQuantity: (quantity: number | null) => void;
  addCleaningItem: (item: Omit<CleaningItem, "id">) => void;
  removeCleaningItem: (id: string) => void;
  updateCleaningItem: (id: string, item: Partial<CleaningItem>) => void;
  setPaymentMethod: (method: OrderPaymentMethod | null) => void;
  resetForm: () => void;
  calculateTotal: () => number;
}

const OrderFormContext = createContext<OrderFormContextType | undefined>(
  undefined
);

const initialFormData: OrderFormData = {
  customer: null,
  type: null,
  ironingQuantity: null,
  cleaningItems: [],
  paymentMethod: null,
};

export function OrderFormProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);

  const setCustomer = useCallback((customer: Customer | null) => {
    setFormData((prev) => ({ ...prev, customer }));
  }, []);

  const setOrderType = useCallback((type: OrderType | null) => {
    setFormData((prev) => ({
      ...prev,
      type,
      // Reset type-specific fields when changing type
      ironingQuantity: null,
      cleaningItems: [],
    }));
  }, []);

  const setIroningQuantity = useCallback((quantity: number | null) => {
    setFormData((prev) => ({ ...prev, ironingQuantity: quantity }));
  }, []);

  const addCleaningItem = useCallback((item: Omit<CleaningItem, "id">) => {
    setFormData((prev) => ({
      ...prev,
      cleaningItems: [
        ...prev.cleaningItems,
        { ...item, id: crypto.randomUUID() },
      ],
    }));
  }, []);

  const removeCleaningItem = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      cleaningItems: prev.cleaningItems.filter((it) => it.id !== id),
    }));
  }, []);

  const updateCleaningItem = useCallback(
    (id: string, item: Partial<CleaningItem>) => {
      setFormData((prev) => ({
        ...prev,
        cleaningItems: prev.cleaningItems.map((it) =>
          it.id === id ? { ...it, ...item } : it
        ),
      }));
    },
    []
  );

  const setPaymentMethod = useCallback((method: OrderPaymentMethod | null) => {
    setFormData((prev) => ({ ...prev, paymentMethod: method }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  const calculateTotal = useCallback((): number => {
    if (formData.type === OrderType.IRONING && formData.ironingQuantity) {
      return calculateIroningTotal(formData.ironingQuantity);
    }
    if (
      formData.type === OrderType.CLEANING &&
      formData.cleaningItems.length > 0
    ) {
      return calculateCleaningTotal(formData.cleaningItems);
    }
    return 0;
  }, [formData]);

  const value: OrderFormContextType = {
    formData,
    setCustomer,
    setOrderType,
    setIroningQuantity,
    addCleaningItem,
    removeCleaningItem,
    updateCleaningItem,
    setPaymentMethod,
    resetForm,
    calculateTotal,
  };

  return (
    <OrderFormContext.Provider value={value}>
      {children}
    </OrderFormContext.Provider>
  );
}

export function useOrderForm() {
  const context = useContext(OrderFormContext);
  if (context === undefined) {
    throw new Error("useOrderForm must be used within an OrderFormProvider");
  }
  return context;
}
