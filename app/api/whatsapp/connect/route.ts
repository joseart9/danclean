import { getToken } from "@/lib/auth";
import { NextResponse } from "next/server";

const WHATSAPP_API_URL =
  process.env.WHATSAPP_API_URL ||
  process.env.NEXT_PUBLIC_WHATSAPP_API_URL ||
  "";

export async function GET() {
  try {
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required. No token provided." },
        { status: 401 }
      );
    }

    // Forward request to WhatsApp backend
    const response = await fetch(`${WHATSAPP_API_URL}/connect`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error connecting to WhatsApp backend:", error);
    return NextResponse.json(
      { error: "Error al conectar con el servicio de WhatsApp" },
      { status: 500 }
    );
  }
}
