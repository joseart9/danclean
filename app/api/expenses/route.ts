import { NextResponse } from "next/server";
import { expenseService } from "@/services/expense-service";
import { createExpenseSchema } from "@/validators/expense";
import { AppError } from "@/errors";
import { z } from "zod";
import { dateStringToUTCRange } from "@/utils/timezone";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate request body
    const validatedData = createExpenseSchema.parse(data);

    // Create expense
    const expense = await expenseService.createExpense(validatedData);

    // Return success response
    return NextResponse.json(expense, { status: 201 });
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
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "from_date and to_date are required" },
        { status: 400 }
      );
    }

    // Parse date strings (should be in YYYY-MM-DD format from frontend)
    // If it's an ISO string, extract just the date part
    const fromDateStr = fromDate.includes("T")
      ? fromDate.split("T")[0]
      : fromDate;
    const toDateStr = toDate.includes("T") ? toDate.split("T")[0] : toDate;

    // Convert local date ranges (Monterrey timezone) to UTC ranges for querying
    const fromRange = dateStringToUTCRange(fromDateStr);
    const toRange = dateStringToUTCRange(toDateStr);

    const from = fromRange.start;
    const to = toRange.end;

    // Get all expenses
    const expenses = await expenseService.getAllExpenses(from, to);

    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los gastos:", error);
    return NextResponse.json(
      { error: "Error al obtener los gastos" },
      { status: 500 }
    );
  }
}
