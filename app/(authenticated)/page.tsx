"use client";

import { useMe } from "@/hooks/useMe";

export default function Home() {
  const { data, isLoading, isError, error } = useMe();

  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>Error: {error?.message}</div>;
  if (!data) return <div>No hay datos</div>;

  return <div>Dan Clean App</div>;
}
