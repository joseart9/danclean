import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export interface DashboardStats {
  totalSales: number;
  totalReceived: number;
  cashOnHand: number;
  totalOrders: number;
  averageOrderValue: number;
  paymentMethods: {
    CASH: number;
    CARD: number;
    TRANSFER: number;
  };
  storage: {
    totalCapacity: number;
    usedCapacity: number;
    freeCapacity: number;
    usagePercentage: number;
  };
  topCustomers: Array<{
    id: string;
    name: string;
    total: number;
    orderCount: number;
  }>;
  ordersByStatus: Record<string, number>;
  ordersByType: Record<string, number>;
  pendingItems: {
    ironing: number;
    cleaning: number;
    total: number;
  };
  dailySales: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

async function fetchDashboardStats(
  fromDate: Date,
  toDate: Date
): Promise<DashboardStats> {
  // Format dates as YYYY-MM-DD strings to avoid timezone issues
  // The date picker creates Date objects at midnight local time, so we extract
  // the local date components to preserve the selected date
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
  const response = await apiClient.get<DashboardStats>("/dashboard/stats", {
    params,
  });
  return response.data;
}

export const useDashboardStats = (fromDate: Date, toDate: Date) => {
  // Format dates for cache key to avoid timezone issues
  const formatDateOnly = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return useQuery({
    queryKey: [
      "dashboard-stats",
      formatDateOnly(fromDate),
      formatDateOnly(toDate),
    ],
    queryFn: () => fetchDashboardStats(fromDate, toDate),
    staleTime: 30 * 1000, // 30 seconds
  });
};
