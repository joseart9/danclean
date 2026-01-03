"use client";

import { useState } from "react";
import { SettingsSidebar } from "@/components/pages/settings/settings-sidebar";
import {
  UserRegistrationForm,
  UsersTable,
} from "@/components/pages/settings/users";
import {
  CleaningItemOptionForm,
  CleaningItemOptionsTable,
} from "@/components/pages/settings/cleaning-item-options";
import { useUsers } from "@/hooks/useUsers";
import { useCleaningItemOptions } from "@/hooks/useCleaningItemOptions";
import { AdminOnly } from "@/components/auth/admin-only";

function SettingsPageContent() {
  const [activeOption, setActiveOption] = useState("usuarios");
  const {
    users,
    isLoading,
    isError,
    error,
    refetch: refetchUsers,
  } = useUsers();
  const {
    data: cleaningItemOptions = [],
    isLoading: isLoadingOptions,
    isError: isErrorOptions,
    error: errorOptions,
    refetch: refetchOptions,
  } = useCleaningItemOptions();

  if (isError) {
    return (
      <div className="py-6">
        <div className="text-destructive">Error: {error?.message}</div>
      </div>
    );
  }

  if (isErrorOptions) {
    return (
      <div className="py-6">
        <div className="text-destructive">Error: {errorOptions?.message}</div>
      </div>
    );
  }

  const handleUserCreated = () => {
    refetchUsers();
  };

  const handleUsersChange = () => {
    refetchUsers();
  };

  const handleOptionCreated = () => {
    refetchOptions();
  };

  const handleOptionsChange = () => {
    refetchOptions();
  };

  return (
    <div className="flex h-full">
      <SettingsSidebar
        activeOption={activeOption}
        onOptionChange={setActiveOption}
      />
      <div className="flex-1 overflow-y-auto p-6 h-full">
        {activeOption === "usuarios" && (
          <div className="space-y-6">
            <UserRegistrationForm onUserCreated={handleUserCreated} />
            <div>
              <h2 className="mb-4 text-xl font-semibold">
                Usuarios Existentes
              </h2>
              <UsersTable
                users={users}
                isLoading={isLoading}
                onUsersChange={handleUsersChange}
              />
            </div>
          </div>
        )}

        {activeOption === "opciones-limpieza" && (
          <div className="space-y-6">
            <CleaningItemOptionForm onOptionCreated={handleOptionCreated} />
            <div>
              <h2 className="mb-4 text-xl font-semibold">
                Opciones de Tintoreria Existentes
              </h2>
              <CleaningItemOptionsTable
                options={cleaningItemOptions}
                isLoading={isLoadingOptions}
                onOptionsChange={handleOptionsChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AdminOnly>
      <SettingsPageContent />
    </AdminOnly>
  );
}
