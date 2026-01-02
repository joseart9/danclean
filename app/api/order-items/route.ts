import { NextResponse } from "next/server";
import { orderItemService } from "@/services/order-item-service";
import { createOrderItemSchema } from "@/validators/order-item";
import { AppError } from "@/errors";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate request body
    const validatedData = createOrderItemSchema.parse(data);

    // Create order item
    const orderItem = await orderItemService.createOrderItem(validatedData);

    // Return success response
    return NextResponse.json(orderItem, { status: 201 });
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    // If orderId is provided, get order items by order id
    if (orderId) {
      const orderItems = await orderItemService.getOrderItemsByOrderId(orderId);
      return NextResponse.json(orderItems, { status: 200 });
    }

    // Otherwise, get all order items
    const orderItems = await orderItemService.getAllOrderItems();

    return NextResponse.json(orderItems, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los items de orden:", error);
    return NextResponse.json(
      { error: "Error al obtener los items de orden" },
      { status: 500 }
    );
  }
}
