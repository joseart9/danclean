"use client";

import { SummaryComponent } from "@/components/pages/pos/summary";
import { IroningComponent } from "@/components/pages/pos/ironing";
import { OrderFormProvider } from "@/components/pages/pos/order-form";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { getCurrentDate } from "@/utils/get-current-date";
import { es } from "react-day-picker/locale";

export default function POSPage() {
  const [date, setDate] = useState<Date>(getCurrentDate("America/Mexico_City"));
  return (
    <OrderFormProvider>
      <div className="grid grid-cols-12 gap-2 h-full">
        <div className="col-span-8">
          <IroningComponent date={date} />
        </div>
        <div className="flex flex-col gap-2 col-span-4 w-full">
          <div className="bg-card rounded-lg p-4 w-full">
            <Calendar
              mode="single"
              onSelect={(value: Date | undefined) => {
                if (value != null) {
                  setDate(value);
                }
              }}
              selected={date}
              timeZone="America/Mexico_City"
              className="capitalize"
              locale={es}
            />
          </div>
          <SummaryComponent />
        </div>
      </div>
    </OrderFormProvider>
  );
}
