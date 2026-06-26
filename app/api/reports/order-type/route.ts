import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { AppError } from "@/errors";
import { OrderType } from "@/types/order";
import { dateStringToUTCRange } from "@/utils/timezone";

const VALID_ORDER_TYPES = [OrderType.IRONING, OrderType.CLEANING] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");
    const orderTypeParam = searchParams.get("order_type");

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "from_date and to_date are required" },
        { status: 400 }
      );
    }

    let orderType: OrderType | undefined;
    if (orderTypeParam) {
      const upper = orderTypeParam.toUpperCase() as OrderType;
      if (!VALID_ORDER_TYPES.includes(upper)) {
        return NextResponse.json(
          { error: "Invalid order_type. Must be IRONING or CLEANING" },
          { status: 400 }
        );
      }
      orderType = upper;
    }

    const fromDateStr = fromDate.includes("T")
      ? fromDate.split("T")[0]
      : fromDate;
    const toDateStr = toDate.includes("T") ? toDate.split("T")[0] : toDate;

    const fromRange = dateStringToUTCRange(fromDateStr);
    const toRange = dateStringToUTCRange(toDateStr);

    const from = fromRange.start;
    const to = toRange.end;

    // Match dashboard's `getTotalOrders` query logic:
    // only main orders (mainOrderId: null), filtered by timestamp, no `paid` filter.
    const orders = await prisma.order.findMany({
      where: {
        mainOrderId: null,
        timestamp: {
          gte: from,
          lte: to,
        },
        ...(orderType ? { type: orderType } : {}),
      },
      include: {
        customer: true,
      },
      orderBy: {
        ticketNumber: "desc",
      },
    });

    const reportData = orders.map((order) => ({
      id: order.id,
      ticketNumber: order.ticketNumber,
      timestamp: order.timestamp,
      customerName: order.customer.name,
      customerLastName: order.customer.lastName,
      orderType: order.type,
      paymentMethod: order.paymentMethod,
      paid: order.paid,
      total: order.total,
    }));

    return NextResponse.json(reportData, { status: 200 });
  } catch (error) {
    console.error("Error fetching order-type report:", error);
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
      { error: "Error al obtener el reporte por tipo" },
      { status: 500 }
    );
  }
}
