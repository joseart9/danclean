"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SkeletonDataTable } from "@/components/ui/data-table-skeleton";
import { columns } from "./columns";
import type { Customer } from "@/types/customer";
import { CustomerDetailsDrawer } from "./customer-details-drawer";

interface CustomersTableProps {
  customers: Customer[];
  isLoading: boolean;
  onCustomersChange?: () => void;
  onSearchChange?: (searchQuery: string) => void;
  page?: number;
  total?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function CustomersTable({
  customers,
  isLoading,
  onCustomersChange,
  onSearchChange,
  page = 0,
  total = 0,
  totalPages = 1,
  pageSize = 10,
  onPageChange,
}: CustomersTableProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
  };

  const handleCustomerUpdated = () => {
    // Trigger refresh of customers list
    onCustomersChange?.();
    // Close drawer
    setIsDrawerOpen(false);
  };

  if (isLoading) {
    return <SkeletonDataTable columns={6} rows={10} />;
  }

  return (
    <>
      <DataTable
        data={customers}
        columns={columns}
        enableSearchOnName={true}
        emptyMessage="No hay clientes encontrados"
        enableExport={true}
        exportFilename="clientes"
        enableColumnResizing={true}
        enableSorting={true}
        enableSortingRemoval={true}
        searchOnNamePlaceholder="Buscar por nombre"
        onRowClick={handleRowClick}
        serverSideSearch={true}
        onSearchChange={onSearchChange}
        enablePagination={true}
        page={page}
        total={total}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
      <CustomerDetailsDrawer
        customer={selectedCustomer}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onCustomerUpdated={handleCustomerUpdated}
      />
    </>
  );
}
