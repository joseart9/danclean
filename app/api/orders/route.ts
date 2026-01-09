import { NextResponse } from "next/server";
import { orderService } from "@/services/order-service";
import { createOrderSchema } from "@/validators/order";
import { AppError } from "@/errors";
import { z } from "zod";
import { OrderStatus } from "@/types/order";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Map snake_case to camelCase for validation
    const mappedData = {
      ...data,
      customerId: data.customer_id || data.customerId,
      paymentMethod: data.payment_method || data.paymentMethod,
      totalPaid: data.total_paid ?? data.totalPaid ?? 0,
      paid: data.paid ?? data.totalPaid ?? 0,
    };
    delete mappedData.customer_id;
    delete mappedData.payment_method;
    delete mappedData.total_paid;

    const timestamp = new Date(mappedData.timestamp);

    // Validate request body
    const validatedData = createOrderSchema.parse({ ...mappedData, timestamp });

    // Create order
    const order = await orderService.createOrder(validatedData);

    // Return success response
    return NextResponse.json(order, { status: 201 });
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
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack, error });
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId =
      searchParams.get("customer_id") || searchParams.get("customerId");
    const orderStatus = searchParams.get("order_status");
    const orderNumber = searchParams.get("order_number");

    // Validate order_status if provided
    let status: OrderStatus | undefined;
    if (orderStatus) {
      // Check if orderStatus is a valid OrderStatus enum value
      const validStatuses = Object.values(OrderStatus);
      if (!validStatuses.includes(orderStatus as OrderStatus)) {
        return NextResponse.json(
          {
            error: `order_status inválido. Valores válidos: ${validStatuses.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
      status = orderStatus as OrderStatus;
    }

    // If orderNumber is provided, get order by order number
    if (orderNumber) {
      const orderNumberInt = parseInt(orderNumber, 10);
      if (isNaN(orderNumberInt)) {
        return NextResponse.json(
          { error: "order_number debe ser un número válido" },
          { status: 400 }
        );
      }
      // For delivery search, exclude delivered orders (default behavior)
      const excludeDelivered =
        searchParams.get("exclude_delivered") !== "false";
      const order = await orderService.getOrderByOrderNumber(
        orderNumberInt,
        excludeDelivered
      );
      return NextResponse.json(order, { status: 200 });
    }

    // If customerId is provided, get orders by customer id with optional status filter
    if (customerId) {
      // For delivery search, exclude delivered orders
      const excludeDelivered = searchParams.get("exclude_delivered") === "true";
      const orders = await orderService.getOrdersByCustomerId(
        customerId,
        status,
        excludeDelivered
      );
      return NextResponse.json(orders, { status: 200 });
    }

    // Otherwise, get all orders
    const includeDelivered = searchParams.get("include_delivered") === "true";
    const limitParam = searchParams.get("limit");
    const skipParam = searchParams.get("skip");
    const name = searchParams.get("name"); // Search by customer name
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const skip = skipParam ? parseInt(skipParam, 10) : undefined;

    const result = await orderService.getAllOrders(
      includeDelivered,
      limit,
      skip,
      name || undefined
    );

    return NextResponse.json(result, { status: 200 });
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
    console.error("Error al obtener las órdenes:", error);
    return NextResponse.json(
      { error: "Error al obtener las órdenes" },
      { status: 500 }
    );
  }
}
