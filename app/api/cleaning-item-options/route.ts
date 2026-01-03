import { NextResponse } from "next/server";
import { cleaningItemOptionService } from "@/services/cleaning-item-option-service";
import { createCleaningItemOptionSchema } from "@/validators/cleaning-item-option";
import { AppError } from "@/errors";
import { z } from "zod";

export async function GET() {
  try {
    // Get all cleaning item options
    const cleaningItemOptions =
      await cleaningItemOptionService.getAllCleaningItemOptions();

    return NextResponse.json(cleaningItemOptions, { status: 200 });
  } catch (error) {
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
    console.error("Error al obtener las opciones de limpieza:", error);
    return NextResponse.json(
      { error: "Error al obtener las opciones de limpieza" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate request body
    const validatedData = createCleaningItemOptionSchema.parse(data);

    // Create cleaning item option
    const cleaningItemOption =
      await cleaningItemOptionService.createCleaningItemOption(validatedData);

    // Return success response
    return NextResponse.json(cleaningItemOption, { status: 201 });
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
    console.error("Error al crear la opción de limpieza:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        error: "Error al crear la opción de limpieza",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
