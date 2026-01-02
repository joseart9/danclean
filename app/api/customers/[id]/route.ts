import { NextResponse } from "next/server";
import { customerService } from "@/services/customer-service";
import { updateCustomerSchema } from "@/validators/customer";
import { AppError } from "@/errors";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get customer by id
    const customer = await customerService.getCustomerById(id);

    return NextResponse.json(customer, { status: 200 });
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
    console.error("Error al obtener el cliente:", error);
    return NextResponse.json(
      { error: "Error al obtener el cliente" },
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
    const validatedData = updateCustomerSchema.parse(data);

    // Update customer
    const updatedCustomer = await customerService.updateCustomer(
      id,
      validatedData
    );

    return NextResponse.json(updatedCustomer, { status: 200 });
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
    console.error("Error al actualizar el cliente:", error);
    return NextResponse.json(
      { error: "Error al actualizar el cliente" },
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

    // Delete customer
    await customerService.deleteCustomer(id);

    return NextResponse.json(
      { message: "Cliente eliminado correctamente" },
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
    console.error("Error al eliminar el cliente:", error);
    return NextResponse.json(
      { error: "Error al eliminar el cliente" },
      { status: 500 }
    );
  }
}
