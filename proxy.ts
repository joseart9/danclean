import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for login page and login API
  if (pathname === "/login" || pathname.startsWith("/api/login")) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get("token")?.value;

  if (!token) {
    // No token, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Verify token
  try {
    const { default: jwt } = await import("jsonwebtoken");
    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      console.error("AUTH_SECRET is not set");
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    jwt.verify(token, secret);
    // Token is valid, continue
    return NextResponse.next();
  } catch {
    // Token invalid, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    // Clear invalid token
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
