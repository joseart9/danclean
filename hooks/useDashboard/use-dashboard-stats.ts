import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export interface DashboardStats {
  totalSales: number;
  totalReceived: number;
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
  const params = {
    from_date: fromDate.toISOString(),
    to_date: toDate.toISOString(),
  };
  const response = await apiClient.get<DashboardStats>("/dashboard/stats", {
    params,
  });
  return response.data;
}

export const useDashboardStats = (fromDate: Date, toDate: Date) => {
  return useQuery({
    queryKey: ["dashboard-stats", fromDate.toISOString(), toDate.toISOString()],
    queryFn: () => fetchDashboardStats(fromDate, toDate),
    staleTime: 30 * 1000, // 30 seconds
  });
};
