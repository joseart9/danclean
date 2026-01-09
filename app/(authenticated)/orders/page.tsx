"use client";

import { useState } from "react";
import * as React from "react";
import { useOrders } from "@/hooks/useOrders";
import { OrdersTable } from "@/components/pages/orders/orders-table";

export default function OrdersPage() {
  const [includeDelivered, setIncludeDelivered] = useState(false);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;
  const prevSearchQueryRef = React.useRef<string>("");

  const { orders, total, totalPages, isLoading, isError, error, refetch } =
    useOrders({
      includeDelivered,
      limit: pageSize,
      page,
      searchQuery: searchQuery || undefined,
    });

  if (isError) {
    return (
      <div className="py-6">
        <div className="text-destructive">Error: {error?.message}</div>
      </div>
    );
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleIncludeDeliveredChange = (include: boolean) => {
    setIncludeDelivered(include);
    setPage(0); // Reset to first page when filter changes
  };

  const handleSearchChange = (query: string) => {
    // Only reset page if search query actually changed
    if (prevSearchQueryRef.current !== query) {
      prevSearchQueryRef.current = query;
      setSearchQuery(query);
      setPage(0); // Reset to first page when searching
    }
  };

  return (
    <div className="py-2">
      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        onOrdersChange={() => refetch()}
        includeDelivered={includeDelivered}
        onIncludeDeliveredChange={handleIncludeDeliveredChange}
        page={page}
        total={total}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
      />
    </div>
  );
}
