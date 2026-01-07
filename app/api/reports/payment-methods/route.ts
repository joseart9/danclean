import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { AppError } from "@/errors";
import { OrderPaymentMethod, OrderType } from "@/types/order";
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

    // Get all orders in date range (only main orders)
    const orders = await prisma.order.findMany({
      where: {
        isMainOrder: true,
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by payment method
    const paymentMethodData = orders.reduce(
      (acc, order) => {
        const method = order.paymentMethod;
        if (!acc[method]) {
          acc[method] = {
            paymentMethod: method as OrderPaymentMethod,
            orders: [],
            totalAmount: 0,
            orderCount: 0,
          };
        }

        // For cleaning orders, divide by 2
        const adjustedTotal =
          order.type === OrderType.CLEANING ? order.total / 2 : order.total;

        acc[method].orders.push({
          id: order.id,
          client: `${order.customer.name} ${order.customer.lastName}`,
          orderType: order.type as OrderType,
          orderTotal: adjustedTotal,
          createdAt: order.createdAt,
        });
        acc[method].totalAmount += adjustedTotal;
        acc[method].orderCount += 1;

        return acc;
      },
      {} as Record<
        OrderPaymentMethod,
        {
          paymentMethod: OrderPaymentMethod;
          orders: Array<{
            id: string;
            client: string;
            orderType: OrderType;
            orderTotal: number;
            createdAt: Date;
          }>;
          totalAmount: number;
          orderCount: number;
        }
      >
    );

    // Convert to array and sort by payment method
    const reportData = Object.values(paymentMethodData).map((data) => ({
      ...data,
      orders: data.orders.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
    }));

    return NextResponse.json(reportData, { status: 200 });
  } catch (error) {
    console.error("Error fetching payment method report:", error);
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
      { error: "Error al obtener el reporte por método de pago" },
      { status: 500 }
    );
  }
}
