"use client";

import { useCustomers } from "@/hooks/useCustomers";
import { CustomersTable } from "@/components/pages/customers/customers-table";
import { AdminOnly } from "@/components/auth/admin-only";

function CustomersPageContent() {
  const { customers, isLoading, isError, error, refetch } = useCustomers();

  if (isError) {
    return (
      <div className="py-6">
        <div className="text-destructive">Error: {error?.message}</div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <CustomersTable
        customers={customers}
        isLoading={isLoading}
        onCustomersChange={() => refetch()}
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
