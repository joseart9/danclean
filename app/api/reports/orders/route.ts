import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { AppError } from "@/errors";
import { OrderType } from "@/types/order";
import { dateStringToUTCRange } from "@/utils/timezone";
import { calculateGarmentCount } from "@/utils";

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
        orderItems: {
          include: {
            order: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform orders to report format
    const reportData = orders.map((order) => {
      // Calculate quantity (garment count)
      let quantity = 0;
      if (order.type === OrderType.IRONING) {
        // For ironing, get quantity from ironing item
        const ironingItemId = order.orderItems.find(
          (item) => item.type === OrderType.IRONING
        )?.itemId;
        if (ironingItemId) {
          // We need to fetch the ironing item, but for now we'll calculate from orderItems
          // Actually, we should include the items in the query
          quantity = order.orderItems
            .filter((item) => item.type === OrderType.IRONING)
            .reduce((sum, item) => {
              // We'll need to fetch the actual item to get quantity
              return sum;
            }, 0);
        }
      } else if (order.type === OrderType.CLEANING) {
        // For cleaning, sum all cleaning item quantities
        const cleaningItemIds = order.orderItems
          .filter((item) => item.type === OrderType.CLEANING)
          .map((item) => item.itemId);
        // We'll need to fetch cleaning items to get quantities
      }

      return {
        id: order.id,
        client: `${order.customer.name} ${order.customer.lastName}`,
        orderType: order.type,
        quantity: 0, // Will be calculated below
        orderTotal: order.total,
        customerId: order.customerId,
        orderItems: order.orderItems,
      };
    });

    // Fetch all items to calculate quantities
    const ironingItemIds = orders
      .flatMap((order) =>
        order.orderItems
          .filter((item) => item.type === OrderType.IRONING)
          .map((item) => item.itemId)
      )
      .filter((id, index, self) => self.indexOf(id) === index);

    const cleaningItemIds = orders
      .flatMap((order) =>
        order.orderItems
          .filter((item) => item.type === OrderType.CLEANING)
          .map((item) => item.itemId)
      )
      .filter((id, index, self) => self.indexOf(id) === index);

    const [ironingItems, cleaningItems] = await Promise.all([
      ironingItemIds.length > 0
        ? prisma.ironingItem.findMany({
            where: { id: { in: ironingItemIds } },
          })
        : [],
      cleaningItemIds.length > 0
        ? prisma.cleaningItem.findMany({
            where: { id: { in: cleaningItemIds } },
          })
        : [],
    ]);

    const ironingItemsMap = new Map(
      ironingItems.map((item) => [item.id, item])
    );
    const cleaningItemsMap = new Map(
      cleaningItems.map((item) => [item.id, item])
    );

    // Calculate quantities for each order
    const finalReportData = reportData.map((item) => {
      let quantity = 0;

      if (item.orderType === OrderType.IRONING) {
        const ironingItemId = item.orderItems.find(
          (oi) => oi.type === OrderType.IRONING
        )?.itemId;
        if (ironingItemId) {
          const ironingItem = ironingItemsMap.get(ironingItemId);
          quantity = ironingItem?.quantity || 0;
        }
      } else if (item.orderType === OrderType.CLEANING) {
        const cleaningItemIds = item.orderItems
          .filter((oi) => oi.type === OrderType.CLEANING)
          .map((oi) => oi.itemId);
        quantity = cleaningItemIds.reduce((sum, id) => {
          const cleaningItem = cleaningItemsMap.get(id);
          return sum + (cleaningItem?.quantity || 0);
        }, 0);
      }

      return {
        id: item.id,
        client: item.client,
        orderType: item.orderType,
        quantity,
        orderTotal: item.orderTotal,
      };
    });

    return NextResponse.json(finalReportData, { status: 200 });
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
