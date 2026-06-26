import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { OrderPaymentMethod, OrderType } from "@/types/order";

export interface OrderTypeReportItem {
  id: string;
  ticketNumber: number;
  timestamp: string;
  customerName: string;
  customerLastName: string;
  orderType: OrderType;
  paymentMethod: OrderPaymentMethod;
  paid: number;
  total: number;
}

const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

async function fetchOrderTypeReport(
  fromDate: Date,
  toDate: Date,
  orderType?: OrderType
): Promise<OrderTypeReportItem[]> {
  const params: Record<string, string> = {
    from_date: formatDateOnly(fromDate),
    to_date: formatDateOnly(toDate),
  };

  if (orderType) {
    params.order_type = orderType;
  }

  const response = await apiClient.get<OrderTypeReportItem[]>(
    "/reports/order-type",
    { params }
  );
  return response.data;
}

export const useOrderTypeReport = (
  fromDate: Date,
  toDate: Date,
  orderType?: OrderType
) => {
  return useQuery({
    queryKey: [
      "order-type-report",
      formatDateOnly(fromDate),
      formatDateOnly(toDate),
      orderType ?? "all",
    ],
    queryFn: () => fetchOrderTypeReport(fromDate, toDate, orderType),
    staleTime: 30 * 1000,
  });
};
