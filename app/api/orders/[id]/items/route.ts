import { NextResponse } from "next/server";
import { orderService } from "@/services/order-service";
import { AppError } from "@/errors";
import { z } from "zod";

const updateOrderItemsSchema = z.union([
  // For IRONING
  z.object({
    quantity: z.number().int().positive("La cantidad debe ser positiva"),
  }),
  // For CLEANING
  z.array(
    z.object({
      id: z.string().uuid().optional(),
      item_name: z.string().min(1, "El nombre del item es requerido"),
      quantity: z.number().int().positive("La cantidad debe ser positiva"),
      price: z.number().positive("El precio debe ser positivo"),
    })
  ),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Validate request body
    const validatedData = updateOrderItemsSchema.parse(data.items);

    // Update order items and recalculate total
    const updatedOrder = await orderService.updateOrderItems(id, validatedData);

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
    console.error("Error al actualizar los items de la orden:", error);
    return NextResponse.json(
      { error: "Error al actualizar los items de la orden" },
      { status: 500 }
    );
  }
}
