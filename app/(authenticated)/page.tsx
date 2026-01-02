"use client";

import { AdminOnly } from "@/components/auth/admin-only";

export default function Home() {
  return (
    <AdminOnly>
      <div>Dan Clean App</div>
    </AdminOnly>
  );
}
