import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { AppError } from "@/errors";
import { dateStringToUTCRange } from "@/utils/timezone";

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

    // Parse date strings
    const fromDateStr = fromDate.includes("T")
      ? fromDate.split("T")[0]
      : fromDate;
    const toDateStr = toDate.includes("T") ? toDate.split("T")[0] : toDate;

    // Convert local date ranges to UTC ranges for querying
    const fromRange = dateStringToUTCRange(fromDateStr);
    const toRange = dateStringToUTCRange(toDateStr);

    const from = fromRange.start;
    const to = toRange.end;

    // Get all orders in date range (only main orders) where paid != 0
    const orders = await prisma.order.findMany({
      where: {
        timestamp: {
          gte: from,
          lte: to,
        },
        paid: {
          not: 0,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        ticketNumber: "desc",
      },
    });

    // Transform orders to report format
    const reportData = orders.map((order) => {
      return {
        id: order.id,
        ticketNumber: order.ticketNumber,
        customerName: order.customer.name,
        customerLastName: order.customer.lastName,
        orderType: order.type,
        paid: order.paid,
      };
    });

    return NextResponse.json(reportData, { status: 200 });
  } catch (error) {
    console.error("Error fetching order report:", error);
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
      { error: "Error al obtener el reporte de órdenes" },
      { status: 500 }
    );
  }
}
