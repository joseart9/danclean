import { NextResponse } from "next/server";
import { cleaningItemService } from "@/services/cleaning-item-service";
import { updateCleaningItemSchema } from "@/validators/cleaning-item";
import { AppError } from "@/errors";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get cleaning item by id
    const cleaningItem = await cleaningItemService.getCleaningItemById(id);

    return NextResponse.json(cleaningItem, { status: 200 });
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
    console.error("Error al obtener el item de limpieza:", error);
    return NextResponse.json(
      { error: "Error al obtener el item de limpieza" },
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
    const validatedData = updateCleaningItemSchema.parse(data);

    // Update cleaning item
    const updatedCleaningItem = await cleaningItemService.updateCleaningItem(
      id,
      validatedData
    );

    return NextResponse.json(updatedCleaningItem, { status: 200 });
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
    console.error("Error al actualizar el item de limpieza:", error);
    return NextResponse.json(
      { error: "Error al actualizar el item de limpieza" },
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

    // Delete cleaning item
    await cleaningItemService.deleteCleaningItem(id);

    return NextResponse.json(
      { message: "Item de limpieza eliminado correctamente" },
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
    console.error("Error al eliminar el item de limpieza:", error);
    return NextResponse.json(
      { error: "Error al eliminar el item de limpieza" },
      { status: 500 }
    );
  }
}
