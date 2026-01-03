import { NextResponse } from "next/server";
import { cleaningItemOptionService } from "@/services/cleaning-item-option-service";
import { updateCleaningItemOptionSchema } from "@/validators/cleaning-item-option";
import { AppError } from "@/errors";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get cleaning item option by id
    const cleaningItemOption =
      await cleaningItemOptionService.getCleaningItemOptionById(id);

    return NextResponse.json(cleaningItemOption, { status: 200 });
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
    console.error("Error al obtener la opción de limpieza:", error);
    return NextResponse.json(
      { error: "Error al obtener la opción de limpieza" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Validate request body
    const validatedData = updateCleaningItemOptionSchema.parse(data);

    // Update cleaning item option
    const updatedCleaningItemOption =
      await cleaningItemOptionService.updateCleaningItemOption(
        id,
        validatedData
      );

    return NextResponse.json(updatedCleaningItemOption, { status: 200 });
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
    console.error("Error al actualizar la opción de limpieza:", error);
    return NextResponse.json(
      { error: "Error al actualizar la opción de limpieza" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete cleaning item option
    await cleaningItemOptionService.deleteCleaningItemOption(id);

    return NextResponse.json(
      { message: "Opción de limpieza eliminada correctamente" },
      { status: 200 }
    );
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
    console.error("Error al eliminar la opción de limpieza:", error);
    return NextResponse.json(
      { error: "Error al eliminar la opción de limpieza" },
      { status: 500 }
    );
  }
}
