import { NextResponse } from "next/server";
import { customerService } from "@/services/customer-service";
import { createCustomerSchema } from "@/validators/customer";
import { AppError } from "@/errors";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate request body
    const validatedData = createCustomerSchema.parse(data);

    // Create customer
    const customer = await customerService.createCustomer(validatedData);

    // Return success response
    return NextResponse.json(customer, { status: 201 });
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
    // Try to search by name if provided
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const limitParam = searchParams.get("limit");
    const skipParam = searchParams.get("skip");

    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const skip = skipParam ? parseInt(skipParam, 10) : undefined;

    if (name) {
      const result = await customerService.getCustomersByName(
        name,
        limit,
        skip
      );
      return NextResponse.json(result, { status: 200 });
    }
    // Get all customers with pagination
    const result = await customerService.getAllCustomers(limit, skip);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los clientes:", error);
    return NextResponse.json(
      { error: "Error al obtener los clientes" },
      { status: 500 }
    );
  }
}
