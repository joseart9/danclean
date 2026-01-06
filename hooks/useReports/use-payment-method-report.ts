import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { OrderPaymentMethod, OrderType } from "@/types/order";

export interface PaymentMethodReportOrder {
  id: string;
  client: string;
  orderType: OrderType;
  orderTotal: number;
  createdAt: Date;
}

export interface PaymentMethodReportItem {
  paymentMethod: OrderPaymentMethod;
  orders: PaymentMethodReportOrder[];
  totalAmount: number;
  orderCount: number;
}

async function fetchPaymentMethodReport(
  fromDate: Date,
  toDate: Date
): Promise<PaymentMethodReportItem[]> {
  const formatDateOnly = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const params = {
    from_date: formatDateOnly(fromDate),
    to_date: formatDateOnly(toDate),
  };
  const response = await apiClient.get<PaymentMethodReportItem[]>(
    "/reports/payment-methods",
    {
      params,
    }
  );
  return response.data;
}

export const usePaymentMethodReport = (fromDate: Date, toDate: Date) => {
  const formatDateOnly = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return useQuery({
    queryKey: [
      "payment-method-report",
      formatDateOnly(fromDate),
      formatDateOnly(toDate),
    ],
    queryFn: () => fetchPaymentMethodReport(fromDate, toDate),
    staleTime: 30 * 1000, // 30 seconds
  });
};
