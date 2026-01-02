"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/hooks/useMe";
import { Spinner } from "@/components/ui/spinner";

interface AdminOnlyProps {
  children: React.ReactNode;
}

export function AdminOnly({ children }: AdminOnlyProps) {
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.push("/pos");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Spinner />
      </div>
    );
  }

  // User is admin, render children
  return <>{children}</>;
}
