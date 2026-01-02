"use client";

import { SummaryComponent } from "@/components/pages/pos/summary";
import { IroningComponent } from "@/components/pages/pos/ironing";
import { OrderFormProvider } from "@/components/pages/pos/order-form";

export default function POSPage() {
  return (
    <OrderFormProvider>
      <div className="grid grid-cols-12 gap-4 h-full">
        <div className="col-span-8">
          <IroningComponent />
        </div>
        <div className="col-span-4">
          <SummaryComponent />
        </div>
      </div>
    </OrderFormProvider>
  );
}
