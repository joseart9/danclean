import { NextResponse } from "next/server";
import { ironingItemService } from "@/services/ironing-item-service";
import { createIroningItemSchema } from "@/validators/ironing-item";
import { AppError } from "@/errors";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate request body
    const validatedData = createIroningItemSchema.parse(data);

    // Create ironing item
    const ironingItem = await ironingItemService.createIroningItem(
      validatedData
    );

    // Return success response
    return NextResponse.json(ironingItem, { status: 201 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const tree = z.treeifyError(error);
      return NextResponse.json({ error: tree }, { status: 400 });
    }

    // Handle custom application errors
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all ironing items
    const ironingItems = await ironingItemService.getAllIroningItems();

    return NextResponse.json(ironingItems, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los items de planchado:", error);
    return NextResponse.json(
      { error: "Error al obtener los items de planchado" },
      { status: 500 }
    );
  }
}
