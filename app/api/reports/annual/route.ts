import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { AppError } from "@/errors";
import { OrderType, OrderPaymentMethod } from "@/types/order";
import { expenseService } from "@/services/expense-service";
import { dateStringToUTCRange } from "@/utils/timezone";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    if (!year) {
      return NextResponse.json({ error: "year is required" }, { status: 400 });
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      return NextResponse.json(
        { error: "year must be a valid number" },
        { status: 400 }
      );
    }

    // Get data for each month of the year
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const monthlyData = await Promise.all(
      months.map(async (monthName, monthIndex) => {
        // Create date range for this month
        const month = monthIndex + 1; // 1-12
        const fromDateStr = `${yearNum}-${String(month).padStart(2, "0")}-01`;

        // Get last day of month
        // month is 1-indexed (1-12), so month + 1 in 0-indexed gives us the next month
        // day 0 of next month = last day of current month
        const lastDay = new Date(yearNum, month, 0).getDate();
        const toDateStr = `${yearNum}-${String(month).padStart(
          2,
          "0"
        )}-${String(lastDay).padStart(2, "0")}`;

        const fromRange = dateStringToUTCRange(fromDateStr);
        const toRange = dateStringToUTCRange(toDateStr);

        // Get orders for this month
        const orders = await prisma.order.findMany({
          where: {
            isMainOrder: true,
            createdAt: {
              gte: fromRange.start,
              lte: toRange.end,
            },
          },
        });

        // Calculate income by order type
        const ironingIncome = orders
          .filter((order) => order.type === OrderType.IRONING)
          .reduce((sum, order) => sum + order.total, 0);

        const cleaningIncome = orders
          .filter((order) => order.type === OrderType.CLEANING)
          .reduce((sum, order) => sum + order.total / 2, 0); // Divide by 2 for cleaning

        // Get expenses for this month
        const expenses = await expenseService.getAllExpenses(
          fromRange.start,
          toRange.end
        );
        const totalExpenses = expenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        );

        const total = ironingIncome + cleaningIncome - totalExpenses;

        return {
          month: monthName,
          monthNumber: month,
          ironingIncome,
          cleaningIncome,
          totalExpenses,
          total,
        };
      })
    );

    return NextResponse.json(monthlyData, { status: 200 });
  } catch (error) {
    console.error("Error fetching annual report:", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener el reporte anual" },
      { status: 500 }
    );
  }
}
