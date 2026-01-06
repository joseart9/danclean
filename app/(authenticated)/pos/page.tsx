"use client";

import { SummaryComponent } from "@/components/pages/pos/summary";
import { IroningComponent } from "@/components/pages/pos/ironing";
import { OrderFormProvider } from "@/components/pages/pos/order-form";

export default function POSPage() {
  return (
    <OrderFormProvider>
      <div className="grid grid-cols-12 gap-2 h-full">
        {/* Order Form - Full width on mobile/tablet portrait, side-by-side on tablet landscape+ */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <IroningComponent />
        </div>
        {/* Summary - Full width on mobile/tablet portrait, side-by-side on tablet landscape+ */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          <SummaryComponent />
        </div>
      </div>
    </OrderFormProvider>
  );
}
