"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Customer } from "@/types/customer";
import { OrderType, OrderPaymentMethod } from "@/types/order";
import { calculateIroningTotal, calculateCleaningTotal } from "@/utils";

export interface CleaningItem {
  item_name: string;
  quantity: number;
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
  addCleaningItem: (item: CleaningItem) => void;
  removeCleaningItem: (index: number) => void;
  updateCleaningItem: (index: number, item: CleaningItem) => void;
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

  const addCleaningItem = useCallback((item: CleaningItem) => {
    setFormData((prev) => ({
      ...prev,
      cleaningItems: [...prev.cleaningItems, item],
    }));
  }, []);

  const removeCleaningItem = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      cleaningItems: prev.cleaningItems.filter((_, i) => i !== index),
    }));
  }, []);

  const updateCleaningItem = useCallback(
    (index: number, item: CleaningItem) => {
      setFormData((prev) => ({
        ...prev,
        cleaningItems: prev.cleaningItems.map((it, i) =>
          i === index ? item : it
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
