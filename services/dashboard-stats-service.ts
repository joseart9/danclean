// DB
import { prisma } from "@/db";
import type { Order } from "@/generated/prisma/client";

// Types
import { OrderPaymentMethod, OrderType } from "@/types/order";
import { OrderStatus } from "@/generated/prisma/enums";

// Services
import { expenseService } from "./expense-service";

// Utils
import { utcDateToLocalDateString } from "@/utils/timezone";

type OrderWithItems = Order & {
  customer: { id: string; name: string; lastName: string };
  orderItems: Array<{ type: string; itemId: string }>;
};

export class DashboardStatsService {
  /**
   * Helper function to get adjusted amount (divide by 2 for CLEANING orders)
   */
  private getAdjustedAmount(order: OrderWithItems, amount: number): number {
    return order.type === OrderType.CLEANING ? amount / 2 : amount;
  }

  /**
   * Get all orders in date range (only main orders, not history versions)
   */
  private async getOrdersInDateRange(
    from: Date,
    to: Date
  ): Promise<OrderWithItems[]> {
    return await prisma.order.findMany({
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
  }

  /**
   * Calculate total sales (sum of all order totals, 100% for all orders)
   * This represents the total sale amount, not the net income
   */
  async getTotalSales(from: Date, to: Date): Promise<number> {
    const orders = await prisma.order.findMany({
      where: {
        mainOrderId: {
          equals: null,
        },
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      select: {
        total: true,
      },
    });

    return orders.reduce((sum, order) => sum + order.total, 0);
  }

  /**
   * Calculate total money received (sum of paid, divided by 2 for CLEANING)
   * Subtract expenses since they reduce net income
   */
  async getTotalReceived(from: Date, to: Date): Promise<number> {
    const ironingOrders = await prisma.order.findMany({
      where: {
        timestamp: {
          gte: from,
          lte: to,
        },
        type: OrderType.IRONING,
      },
      select: {
        paid: true,
      },
    });

    const cleaningOrders = await prisma.order.findMany({
      where: {
        timestamp: {
          gte: from,
          lte: to,
        },
        type: OrderType.CLEANING,
      },
      select: {
        paid: true,
      },
    });

    const expenses = await expenseService.getAllExpenses(from, to);
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return (
      ironingOrders.reduce((sum, order) => sum + order.paid, 0) +
      cleaningOrders.reduce((sum, order) => sum + order.paid, 0) / 2 -
      totalExpenses
    );
  }

  /**
   * Calculate cash on hand (100% of cash payments, including CLEANING, because partner is paid later)
   * Subtract expenses since they reduce cash in register
   */
  async getCashOnHand(from: Date, to: Date): Promise<number> {
    const cashOnHand = await prisma.order.findMany({
      where: {
        timestamp: {
          gte: from,
          lte: to,
        },
        paymentMethod: OrderPaymentMethod.CASH,
      },
      select: {
        paid: true,
      },
    });

    const expenses = await expenseService.getAllExpenses(from, to);
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return (
      cashOnHand.reduce((sum, order) => sum + order.paid, 0) - totalExpenses
    );
  }

  /**
   * Get total orders count
   */
  async getTotalOrders(from: Date, to: Date): Promise<number> {
    const orders = await prisma.order.aggregate({
      where: {
        timestamp: {
          gte: from,
          lte: to,
        },
        mainOrderId: {
          equals: null,
        },
      },
      _count: {
        _all: true,
      },
    });
    return orders._count._all;
  }

  /**
   * Get average order value
   */
  async getAverageOrderValue(from: Date, to: Date): Promise<number> {
    const totalSales = await this.getTotalSales(from, to);
    const totalOrders = await this.getTotalOrders(from, to);
    return totalOrders > 0 ? totalSales / totalOrders : 0;
  }

  /**
   * Calculate payment methods breakdown
   */
  async getPaymentMethods(
    from: Date,
    to: Date
  ): Promise<Record<OrderPaymentMethod, number>> {
    const ironingOrders = await prisma.order.findMany({
      where: {
        timestamp: {
          gte: from,
          lte: to,
        },
        type: OrderType.IRONING,
      },
      select: {
        paymentMethod: true,
        paid: true,
      },
    });

    const cleaningOrders = await prisma.order.findMany({
      where: {
        timestamp: {
          gte: from,
          lte: to,
        },
        type: OrderType.CLEANING,
      },
      select: {
        paymentMethod: true,
        paid: true,
      },
    });

    const paymentMethods = {} as Record<OrderPaymentMethod, number>;

    // Sum ironing orders (100% of paid amount)
    ironingOrders.forEach((order) => {
      const method = order.paymentMethod as OrderPaymentMethod;
      paymentMethods[method] = (paymentMethods[method] || 0) + order.paid;
    });

    // Sum cleaning orders (100% of paid amount)
    cleaningOrders.forEach((order) => {
      const method = order.paymentMethod as OrderPaymentMethod;
      paymentMethods[method] = (paymentMethods[method] || 0) + order.paid;
    });

    return {
      CASH: paymentMethods[OrderPaymentMethod.CASH] || 0,
      CARD: paymentMethods[OrderPaymentMethod.CARD] || 0,
      TRANSFER: paymentMethods[OrderPaymentMethod.TRANSFER] || 0,
    };
  }
  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalCapacity: number;
    usedCapacity: number;
    freeCapacity: number;
    usagePercentage: number;
  }> {
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
    const usagePercentage =
      totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

    return {
      totalCapacity,
      usedCapacity,
      freeCapacity,
      usagePercentage,
    };
  }

  /**
   * Get top customers by total spent (all time, not filtered by date range)
   */
  async getTopCustomers(): Promise<
    Array<{
      id: string;
      name: string;
      total: number;
      orderCount: number;
    }>
  > {
    const allOrders = await prisma.order.findMany({
      where: {
        isMainOrder: true,
      },
      include: {
        customer: true,
      },
    });

    const getAdjustedCustomerAmount = (
      order: (typeof allOrders)[0],
      amount: number
    ) => {
      return order.type === OrderType.CLEANING ? amount / 2 : amount;
    };

    type CustomerTotal = {
      customer: (typeof allOrders)[0]["customer"];
      total: number;
      orderCount: number;
    };

    const customerTotals = allOrders.reduce((acc, order) => {
      const customerId = order.customerId;
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: order.customer,
          total: 0,
          orderCount: 0,
        };
      }
      acc[customerId].total += getAdjustedCustomerAmount(order, order.total);
      acc[customerId].orderCount += 1;
      return acc;
    }, {} as Record<string, CustomerTotal>);

    const customerTotalsArray: CustomerTotal[] = Object.values(customerTotals);

    return customerTotalsArray
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((item) => ({
        id: item.customer.id,
        name: `${item.customer.name} ${item.customer.lastName}`,
        total: item.total,
        orderCount: item.orderCount,
      }));
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(
    from: Date,
    to: Date
  ): Promise<Record<OrderStatus, number>> {
    const orders = await this.getOrdersInDateRange(from, to);
    return orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);
  }

  /**
   * Get orders by type
   */
  async getOrdersByType(
    from: Date,
    to: Date
  ): Promise<Record<"IRONING" | "CLEANING", number>> {
    const orders = await prisma.order.findMany({
      where: {
        mainOrderId: {
          equals: null,
        },
        timestamp: {
          gte: from,
          lte: to,
        },
      },
    });
    return orders.reduce((acc, order) => {
      acc[order.type] = (acc[order.type] || 0) + 1;
      return acc;
    }, {} as Record<"IRONING" | "CLEANING", number>);
  }

  /**
   * Get pending items count (ironing and cleaning)
   */
  async getPendingItems(): Promise<{
    ironing: number;
    cleaning: number;
    total: number;
  }> {
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

    return {
      ironing: pendingIroningItems,
      cleaning: pendingCleaningItems,
      total: pendingIroningItems + pendingCleaningItems,
    };
  }

  /**
   * Get daily sales data for chart
   * Group by local date in Monterrey timezone, not UTC
   */
  async getDailySales(
    from: Date,
    to: Date
  ): Promise<Array<{ date: string; sales: number; orders: number }>> {
    const dailySales = await prisma.order.findMany({
      where: {
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      select: {
        paid: true,
        timestamp: true,
      },
    });
    const dailySalesByDate = dailySales.reduce((acc, order) => {
      const dateKey = utcDateToLocalDateString(order.timestamp);
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, sales: 0, orders: 0 };
      }
      acc[dateKey].sales += order.paid;
      acc[dateKey].orders += 1;
      return acc;
    }, {} as Record<string, { date: string; sales: number; orders: number }>);
    return Object.values(dailySalesByDate);
  }

  /**
   * Get all dashboard stats
   */
  async getAllStats(from: Date, to: Date) {
    const [
      totalSales,
      totalReceived,
      cashOnHand,
      totalOrders,
      averageOrderValue,
      paymentMethods,
      storage,
      topCustomers,
      ordersByStatus,
      ordersByType,
      pendingItems,
      dailySales,
    ] = await Promise.all([
      this.getTotalSales(from, to),
      this.getTotalReceived(from, to),
      this.getCashOnHand(from, to),
      this.getTotalOrders(from, to),
      this.getAverageOrderValue(from, to),
      this.getPaymentMethods(from, to),
      this.getStorageStats(),
      this.getTopCustomers(),
      this.getOrdersByStatus(from, to),
      this.getOrdersByType(from, to),
      this.getPendingItems(),
      this.getDailySales(from, to),
    ]);

    return {
      totalSales,
      totalReceived,
      cashOnHand,
      totalOrders,
      averageOrderValue,
      paymentMethods,
      storage,
      topCustomers,
      ordersByStatus,
      ordersByType,
      pendingItems,
      dailySales,
    };
  }
}

export const dashboardStatsService = new DashboardStatsService();
