import { NextResponse } from "next/server";
import { cleaningItemService } from "@/services/cleaning-item-service";
import { createCleaningItemSchema } from "@/validators/cleaning-item";
import { AppError } from "@/errors";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate request body
    const validatedData = createCleaningItemSchema.parse(data);

    // Create cleaning item
    const cleaningItem = await cleaningItemService.createCleaningItem(
      validatedData
    );

    // Return success response
    return NextResponse.json(cleaningItem, { status: 201 });
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
    // Get all cleaning items
    const cleaningItems = await cleaningItemService.getAllCleaningItems();

    return NextResponse.json(cleaningItems, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los items de limpieza:", error);
    return NextResponse.json(
      { error: "Error al obtener los items de limpieza" },
      { status: 500 }
    );
  }
}
