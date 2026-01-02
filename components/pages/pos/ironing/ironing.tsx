"use client";

import { OrderForm } from "@/components/pages/pos/order-form";

export const IroningComponent = () => {
  return (
    <div className="bg-card rounded-lg p-6 h-full">
      <h1 className="text-2xl font-bold mb-6">Punto de Venta</h1>
      <OrderForm />
    </div>
  );
};
