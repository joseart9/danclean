import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { AppError } from "@/errors";
import { OrderPaymentMethod } from "@/types/order";
import { OrderStatus } from "@/generated/prisma/enums";

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

    const from = new Date(fromDate);
    const to = new Date(toDate);
    // Set to end of day
    to.setHours(23, 59, 59, 999);

    // Get all orders in date range (only main orders, not history versions)
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
        orderItems: true,
      },
    });

    // Calculate total sales (sum of all order totals)
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

    // Calculate total money received (sum of totalPaid)
    const totalReceived = orders.reduce(
      (sum, order) => sum + order.totalPaid,
      0
    );

    // Calculate payment methods breakdown
    const paymentMethods = orders.reduce((acc, order) => {
      acc[order.paymentMethod] =
        (acc[order.paymentMethod] || 0) + order.totalPaid;
      return acc;
    }, {} as Record<OrderPaymentMethod, number>);

    // Get storage statistics
    const storages = await prisma.storage.findMany({
      include: {
        orders: {
          where: {
            status: {
              not: OrderStatus.DELIVERED,
            },
          },
        },
      },
    });

    const totalCapacity = storages.reduce(
      (sum, storage) => sum + storage.totalCapacity,
      0
    );
    const usedCapacity = storages.reduce(
      (sum, storage) => sum + storage.usedCapacity,
      0
    );
    const freeCapacity = totalCapacity - usedCapacity;

    // Get top customers by total spent (all time, not filtered by date range)
    const allOrders = await prisma.order.findMany({
      where: {
        isMainOrder: true,
      },
      include: {
        customer: true,
      },
    });

    const customerTotals = allOrders.reduce(
      (acc, order) => {
        const customerId = order.customerId;
        if (!acc[customerId]) {
          acc[customerId] = {
            customer: order.customer,
            total: 0,
            orderCount: 0,
          };
        }
        acc[customerId].total += order.total;
        acc[customerId].orderCount += 1;
        return acc;
      },
      {} as Record<
        string,
        {
          customer: (typeof allOrders)[0]["customer"];
          total: number;
          orderCount: number;
        }
      >
    );

    const topCustomers = Object.values(customerTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((item) => ({
        id: item.customer.id,
        name: `${item.customer.name} ${item.customer.lastName}`,
        total: item.total,
        orderCount: item.orderCount,
      }));

    // Get orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    // Get orders by type
    const ordersByType = orders.reduce((acc, order) => {
      acc[order.type] = (acc[order.type] || 0) + 1;
      return acc;
    }, {} as Record<"IRONING" | "CLEANING", number>);

    // Get pending ironing items count
    const pendingIroningOrders = await prisma.order.findMany({
      where: {
        isMainOrder: true,
        type: "IRONING",
        status: {
          in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
        },
      },
      include: {
        orderItems: true,
      },
    });

    const pendingIroningItemIds = pendingIroningOrders.flatMap((order) =>
      order.orderItems
        .filter((item) => item.type === "IRONING")
        .map((item) => item.itemId)
    );

    const pendingIroningItemsData = await prisma.ironingItem.findMany({
      where: {
        id: {
          in: pendingIroningItemIds,
        },
      },
    });

    const pendingIroningItems = pendingIroningItemsData.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Get pending cleaning items count
    const pendingCleaningOrders = await prisma.order.findMany({
      where: {
        isMainOrder: true,
        type: "CLEANING",
        status: {
          in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
        },
      },
      include: {
        orderItems: true,
      },
    });

    const pendingCleaningItemIds = pendingCleaningOrders.flatMap((order) =>
      order.orderItems
        .filter((item) => item.type === "CLEANING")
        .map((item) => item.itemId)
    );

    const pendingCleaningItemsData = await prisma.cleaningItem.findMany({
      where: {
        id: {
          in: pendingCleaningItemIds,
        },
      },
    });

    const pendingCleaningItems = pendingCleaningItemsData.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Get daily sales data for chart
    const dailySales = orders.reduce((acc, order) => {
      const dateKey = order.createdAt.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, sales: 0, orders: 0 };
      }
      acc[dateKey].sales += order.total;
      acc[dateKey].orders += 1;
      return acc;
    }, {} as Record<string, { date: string; sales: number; orders: number }>);

    const dailySalesArray = Object.values(dailySales).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Get total orders count
    const totalOrders = orders.length;

    // Get average order value
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return NextResponse.json(
      {
        totalSales,
        totalReceived,
        totalOrders,
        averageOrderValue,
        paymentMethods: {
          CASH: paymentMethods[OrderPaymentMethod.CASH] || 0,
          CARD: paymentMethods[OrderPaymentMethod.CARD] || 0,
          TRANSFER: paymentMethods[OrderPaymentMethod.TRANSFER] || 0,
        },
        storage: {
          totalCapacity,
          usedCapacity,
          freeCapacity,
          usagePercentage:
            totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0,
        },
        topCustomers,
        ordersByStatus,
        ordersByType,
        pendingItems: {
          ironing: pendingIroningItems,
          cleaning: pendingCleaningItems,
          total: pendingIroningItems + pendingCleaningItems,
        },
        dailySales: dailySalesArray,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
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
      { error: "Error al obtener las estadísticas del dashboard" },
      { status: 500 }
    );
  }
}
