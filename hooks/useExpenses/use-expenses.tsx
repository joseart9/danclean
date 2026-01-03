import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export interface Expense {
  id: string;
  name: string;
  amount: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
}

interface UseExpensesParams {
  fromDate?: Date;
  toDate?: Date;
  enabled?: boolean;
}

async function fetchExpenses(params?: UseExpensesParams): Promise<Expense[]> {
  const searchParams = new URLSearchParams();
  if (params?.fromDate) {
    searchParams.append("from_date", params.fromDate.toISOString());
  }
  if (params?.toDate) {
    searchParams.append("to_date", params.toDate.toISOString());
  }

  const queryString = searchParams.toString();
  const url = `/expenses${queryString ? `?${queryString}` : ""}`;

  const response = await apiClient.get<Expense[]>(url);
  return response.data;
}

export function useExpenses(params?: UseExpensesParams) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["expenses", params?.fromDate, params?.toDate],
    queryFn: () => fetchExpenses(params),
    enabled: params?.enabled !== false,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    data: data || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
