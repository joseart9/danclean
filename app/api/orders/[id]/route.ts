import { NextResponse } from "next/server";
import { orderService } from "@/services/order-service";
import { updateOrderSchema } from "@/validators/order";
import { AppError } from "@/errors";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get order by id
    const order = await orderService.getOrderById(id);

    return NextResponse.json(order, { status: 200 });
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
    console.error("Error al obtener la orden:", error);
    return NextResponse.json(
      { error: "Error al obtener la orden" },
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
    const timestamp = new Date(data.timestamp);

    console.log("timestamp", timestamp);

    // Validate request body
    const validatedData = updateOrderSchema.parse({
      ...data,
      timestamp,
    });

    // Update order
    const updatedOrder = await orderService.updateOrder(id, validatedData);

    return NextResponse.json(updatedOrder, { status: 200 });
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
    console.error("Error al actualizar la orden:", error);
    return NextResponse.json(
      { error: "Error al actualizar la orden" },
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

    // Delete order
    await orderService.deleteOrder(id);

    return NextResponse.json(
      { message: "Orden eliminada correctamente" },
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
    console.error("Error al eliminar la orden:", error);
    return NextResponse.json(
      { error: "Error al eliminar la orden" },
      { status: 500 }
    );
  }
}
