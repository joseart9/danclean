"use client";

import { OrderForm } from "@/components/pages/pos/order-form";

export const IroningComponent = () => {
  return (
    <div className="bg-card rounded-lg p-4 md:p-5 lg:p-6 h-full">
      <h1 className="text-base md:text-lg font-bold mb-3 md:mb-4">
        Punto de Venta
      </h1>
      <OrderForm />
    </div>
  );
};
