"use client";

import { useState } from "react";
import * as React from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { CustomersTable } from "@/components/pages/customers/customers-table";
import { AdminOnly } from "@/components/auth/admin-only";

function CustomersPageContent() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;
  const prevSearchQueryRef = React.useRef<string>("");

  const { customers, total, totalPages, isLoading, isError, error, refetch } =
    useCustomers({
      page,
      limit: pageSize,
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
      <CustomersTable
        customers={customers}
        isLoading={isLoading}
        onCustomersChange={() => refetch()}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        page={page}
        total={total}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default function CustomersPage() {
  return (
    <AdminOnly>
      <CustomersPageContent />
    </AdminOnly>
  );
}
