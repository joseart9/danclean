import { NextResponse } from "next/server";
import { expenseService } from "@/services/expense-service";
import { updateExpenseSchema } from "@/validators/expense";
import { AppError } from "@/errors";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await expenseService.getExpenseById(params.id);
    return NextResponse.json(expense, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    console.error("Error al obtener el gasto:", error);
    return NextResponse.json(
      { error: "Error al obtener el gasto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Validate request body
    const validatedData = updateExpenseSchema.parse(data);

    // Update expense
    const expense = await expenseService.updateExpense(
      params.id,
      validatedData
    );

    // Return success response
    return NextResponse.json(expense, { status: 200 });
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await expenseService.deleteExpense(params.id);
    return NextResponse.json(
      { message: "Gasto eliminado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    console.error("Error al eliminar el gasto:", error);
    return NextResponse.json(
      { error: "Error al eliminar el gasto" },
      { status: 500 }
    );
  }
}
