import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export interface OrderReportItem {
  id: string;
  client: string;
  orderType: "IRONING" | "CLEANING";
  quantity: number;
  orderTotal: number;
}

async function fetchOrderReport(
  fromDate: Date,
  toDate: Date
): Promise<OrderReportItem[]> {
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
  const response = await apiClient.get<OrderReportItem[]>("/reports/orders", {
    params,
  });
  return response.data;
}

export const useOrderReport = (fromDate: Date, toDate: Date) => {
  const formatDateOnly = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return useQuery({
    queryKey: [
      "order-report",
      formatDateOnly(fromDate),
      formatDateOnly(toDate),
    ],
    queryFn: () => fetchOrderReport(fromDate, toDate),
    staleTime: 30 * 1000, // 30 seconds
  });
};
