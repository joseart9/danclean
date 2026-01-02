import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Sesión cerrada exitosamente" },
    { status: 200 }
  );

  // Delete the token cookie
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Set to 0 to delete immediately
    path: "/",
  });

  return response;
}
