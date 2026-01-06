import { getToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const WHATSAPP_API_URL =
  process.env.WHATSAPP_API_URL ||
  process.env.NEXT_PUBLIC_WHATSAPP_API_URL ||
  "";

const sendMessageSchema = z.object({
  to: z.string().min(1, "Phone number is required"),
  message: z.string().min(1, "Message is required"),
});

export async function POST(request: Request) {
  try {
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required. No token provided." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Forward request to WhatsApp backend
    const response = await fetch(`${WHATSAPP_API_URL}/send-msg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: validatedData.to,
        message: validatedData.message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json(
      { error: "Error al enviar mensaje de WhatsApp" },
      { status: 500 }
    );
  }
}
