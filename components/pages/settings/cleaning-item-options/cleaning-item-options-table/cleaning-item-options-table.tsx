"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SkeletonDataTable } from "@/components/ui/data-table-skeleton";
import { columns } from "./columns";
import type { CleaningItemOption } from "@/hooks/useCleaningItemOptions";
import { CleaningItemOptionDetailsDrawer } from "./cleaning-item-option-details-drawer";

interface CleaningItemOptionsTableProps {
  options: CleaningItemOption[];
  isLoading: boolean;
  onOptionsChange?: () => void;
}

export function CleaningItemOptionsTable({
  options,
  isLoading,
  onOptionsChange,
}: CleaningItemOptionsTableProps) {
  const [selectedOption, setSelectedOption] =
    useState<CleaningItemOption | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRowClick = (option: CleaningItemOption) => {
    setSelectedOption(option);
    setIsDrawerOpen(true);
  };

  const handleOptionUpdated = () => {
    // Trigger refresh of options list
    onOptionsChange?.();
    // Close drawer
    setIsDrawerOpen(false);
  };

  if (isLoading) {
    return <SkeletonDataTable columns={2} rows={10} />;
  }

  return (
    <>
      <DataTable
        data={options}
        columns={columns}
        enableSearchOnName={true}
        emptyMessage="No hay opciones de limpieza encontradas"
        enableExport={true}
        exportFilename="opciones-limpieza"
        enableColumnResizing={true}
        enableSorting={true}
        enableSortingRemoval={true}
        searchOnNamePlaceholder="Buscar por nombre"
        onRowClick={handleRowClick}
      />
      <CleaningItemOptionDetailsDrawer
        option={selectedOption}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onOptionUpdated={handleOptionUpdated}
      />
    </>
  );
}
