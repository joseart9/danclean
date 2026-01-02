import { NextResponse } from "next/server";
import { ironingItemService } from "@/services/ironing-item-service";
import { updateIroningItemSchema } from "@/validators/ironing-item";
import { AppError } from "@/errors";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get ironing item by id
    const ironingItem = await ironingItemService.getIroningItemById(id);

    return NextResponse.json(ironingItem, { status: 200 });
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
    console.error("Error al obtener el item de planchado:", error);
    return NextResponse.json(
      { error: "Error al obtener el item de planchado" },
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
    const validatedData = updateIroningItemSchema.parse(data);

    // Update ironing item
    const updatedIroningItem = await ironingItemService.updateIroningItem(
      id,
      validatedData
    );

    return NextResponse.json(updatedIroningItem, { status: 200 });
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
    console.error("Error al actualizar el item de planchado:", error);
    return NextResponse.json(
      { error: "Error al actualizar el item de planchado" },
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

    // Delete ironing item
    await ironingItemService.deleteIroningItem(id);

    return NextResponse.json(
      { message: "Item de planchado eliminado correctamente" },
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
    console.error("Error al eliminar el item de planchado:", error);
    return NextResponse.json(
      { error: "Error al eliminar el item de planchado" },
      { status: 500 }
    );
  }
}
