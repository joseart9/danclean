import { NextResponse } from "next/server";
import { orderItemService } from "@/services/order-item-service";
import { updateOrderItemSchema } from "@/validators/order-item";
import { AppError } from "@/errors";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get order item by id
    const orderItem = await orderItemService.getOrderItemById(id);

    return NextResponse.json(orderItem, { status: 200 });
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
    console.error("Error al obtener el item de orden:", error);
    return NextResponse.json(
      { error: "Error al obtener el item de orden" },
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
    const validatedData = updateOrderItemSchema.parse(data);

    // Update order item
    const updatedOrderItem = await orderItemService.updateOrderItem(
      id,
      validatedData
    );

    return NextResponse.json(updatedOrderItem, { status: 200 });
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
    console.error("Error al actualizar el item de orden:", error);
    return NextResponse.json(
      { error: "Error al actualizar el item de orden" },
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

    // Delete order item
    await orderItemService.deleteOrderItem(id);

    return NextResponse.json(
      { message: "Item de orden eliminado correctamente" },
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
    console.error("Error al eliminar el item de orden:", error);
    return NextResponse.json(
      { error: "Error al eliminar el item de orden" },
      { status: 500 }
    );
  }
}
