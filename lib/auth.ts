import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export interface TokenPayload {
  userSession: {
    userId: string;
  };
  iat?: number;
  exp?: number;
}

export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value || null;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      console.error("AUTH_SECRET is not set");
      return null;
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export async function getTokenPayload(): Promise<TokenPayload | null> {
  try {
    const token = await getToken();
    if (!token) {
      return null;
    }
    return await verifyToken(token);
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    return null;
  }
}
