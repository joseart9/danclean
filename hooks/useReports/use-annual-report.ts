import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export interface AnnualReportItem {
  month: string;
  monthNumber: number;
  ironingIncome: number;
  cleaningIncome: number;
  totalExpenses: number;
  total: number;
}

async function fetchAnnualReport(year: number): Promise<AnnualReportItem[]> {
  const response = await apiClient.get<AnnualReportItem[]>("/reports/annual", {
    params: {
      year: year.toString(),
    },
  });
  return response.data;
}

export const useAnnualReport = (year: number) => {
  return useQuery({
    queryKey: ["annual-report", year],
    queryFn: () => fetchAnnualReport(year),
    staleTime: 30 * 1000, // 30 seconds
  });
};
