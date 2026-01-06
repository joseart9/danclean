"use client";

import { useState } from "react";
import { useDateRange } from "@/providers/date-range-provider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  OrderReport,
  AnnualReport,
  PaymentMethodReport,
} from "@/components/pages/reports";

export default function ReportsPage() {
  const { range } = useDateRange();
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="py-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="orders">Reporte de Órdenes</TabsTrigger>
          <TabsTrigger value="annual">Estado de Resultados</TabsTrigger>
          <TabsTrigger value="payment-methods">
            Reporte por Método de Pago
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <OrderReport fromDate={range.from} toDate={range.to || range.from} />
        </TabsContent>
        <TabsContent value="annual">
          <AnnualReport />
        </TabsContent>
        <TabsContent value="payment-methods">
          <PaymentMethodReport
            fromDate={range.from}
            toDate={range.to || range.from}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
