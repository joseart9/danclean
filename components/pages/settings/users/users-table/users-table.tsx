"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SkeletonDataTable } from "@/components/ui/data-table-skeleton";
import { columns } from "./columns";
import type { User } from "@/types/user";
import { UserDetailsDrawer } from "./user-details-drawer";

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  onUsersChange?: () => void;
}

export function UsersTable({
  users,
  isLoading,
  onUsersChange,
}: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRowClick = (user: User) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const handleUserUpdated = () => {
    // Trigger refresh of users list
    onUsersChange?.();
    // Close drawer
    setIsDrawerOpen(false);
  };

  if (isLoading) {
    return <SkeletonDataTable columns={4} rows={10} />;
  }

  return (
    <>
      <DataTable
        data={users}
        columns={columns}
        enableSearchOnName={true}
        emptyMessage="No hay usuarios encontrados"
        enableExport={true}
        exportFilename="usuarios"
        enableColumnResizing={true}
        enableSorting={true}
        enableSortingRemoval={true}
        searchOnNamePlaceholder="Buscar por nombre"
        onRowClick={handleRowClick}
      />
      <UserDetailsDrawer
        user={selectedUser}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onUserUpdated={handleUserUpdated}
      />
    </>
  );
}
