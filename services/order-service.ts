// DB
import { prisma } from "@/db";
import type {
  Order,
  OrderItem,
  IroningItem,
  CleaningItem,
} from "@/generated/prisma/client";

// Errors
import { OrderNotFoundError } from "@/errors";

// Validators
import { CreateOrderInput, UpdateOrderInput } from "@/validators/order";

// Types
import { OrderType, OrderStatus } from "@/types/order";

// Services
import { ironingItemService } from "./ironing-item-service";
import { cleaningItemService } from "./cleaning-item-service";
import { storageService } from "./storage-service";

// Context
import { getUserId } from "@/lib/auth";

// Utils
import {
  calculateIroningTotal,
  calculateCleaningTotal,
  calculateGarmentCount,
} from "@/utils";

// Cleaning prices for individual item totals (needed for database storage)
const CLEANING_PRICES: Record<string, number> = {
  VESTIDO: 10.0,
  TRAJE: 15.0,
};

export class OrderService {
  /**
   * Helper method to enrich orders with their actual items (ironing or cleaning)
   */
  private async enrichOrdersWithItems(
    orders: (Order & {
      orderItems?: OrderItem[];
      customer?: unknown;
      storage?: unknown;
      mainOrder?: unknown;
      orderHistory?: unknown[];
    })[]
  ) {
    // Collect all item IDs grouped by type
    const ironingItemIds: string[] = [];
    const cleaningItemIds: string[] = [];

    orders.forEach((order) => {
      order.orderItems?.forEach((orderItem) => {
        if (orderItem.type === OrderType.IRONING) {
          ironingItemIds.push(orderItem.itemId);
        } else if (orderItem.type === OrderType.CLEANING) {
          cleaningItemIds.push(orderItem.itemId);
        }
      });
    });

    // Fetch all items in parallel
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

    // Create maps for quick lookup
    const ironingItemsMap = new Map<string, IroningItem>(
      ironingItems.map((item) => [item.id, item])
    );
    const cleaningItemsMap = new Map<string, CleaningItem>(
      cleaningItems.map((item) => [item.id, item])
    );

    // Enrich each order with its items
    return orders.map((order) => {
      const items: (IroningItem | CleaningItem)[] = [];
      order.orderItems?.forEach((orderItem) => {
        if (orderItem.type === OrderType.IRONING) {
          const item = ironingItemsMap.get(orderItem.itemId);
          if (item) items.push(item);
        } else if (orderItem.type === OrderType.CLEANING) {
          const item = cleaningItemsMap.get(orderItem.itemId);
          if (item) items.push(item);
        }
      });

      // For IRONING orders, items should be a single item (or array with one item)
      // For CLEANING orders, items should be an array
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { orderItems: _orderItems, ...orderWithoutItems } = order;
      const enrichedOrder = {
        ...orderWithoutItems,
        items: order.type === OrderType.IRONING ? items[0] || null : items,
      };

      return enrichedOrder;
    });
  }

  async createOrder(
    data: CreateOrderInput & {
      mainOrderId?: string | null;
      orderNumber?: number;
    }
  ) {
    // Get user ID
    const userId = await getUserId();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    let createdItemIds: string[] = [];
    let total = 0;
    let garmentCount = 0;

    // Create items based on order type
    if (data.type === OrderType.IRONING) {
      // Create ironing item
      const ironingTotal = calculateIroningTotal(data.items.quantity);
      const ironingItem = await ironingItemService.createIroningItem({
        quantity: data.items.quantity,
        total: ironingTotal,
      });
      createdItemIds = [ironingItem.id];
      total = ironingTotal;
      garmentCount = data.items.quantity;
    } else if (data.type === OrderType.CLEANING) {
      // Create cleaning items
      const cleaningItems = await Promise.all(
        data.items.map(async (item) => {
          const itemTotal =
            (CLEANING_PRICES[item.item_name] || 10.0) * item.quantity;
          const cleaningItem = await cleaningItemService.createCleaningItem({
            item_name: item.item_name,
            quantity: item.quantity,
            total: itemTotal,
          });
          return cleaningItem;
        })
      );
      createdItemIds = cleaningItems.map((item) => item.id);
      total = calculateCleaningTotal(data.items);
      garmentCount = calculateGarmentCount(data);
    }

    // Allocate storage and order number if not explicitly provided
    if (data.orderNumber !== undefined) {
      // Use provided order number (for backward compatibility or special cases)
      // Create order with provided number
      const newOrder = await prisma.order.create({
        data: {
          type: data.type,
          customerId: data.customerId,
          paymentStatus: data.paymentStatus,
          paymentMethod: data.paymentMethod,
          status: data.status,
          total: total,
          totalPaid: data.totalPaid ?? 0,
          orderNumber: data.orderNumber,
          storageId: null,
          userId: userId,
          mainOrderId: data.mainOrderId,
        },
      });

      // Create order items to link order with items
      await Promise.all(
        createdItemIds.map((itemId) =>
          prisma.orderItem.create({
            data: {
              type: data.type,
              orderId: newOrder.id,
              itemId: itemId,
            },
          })
        )
      );

      // Return order with relations
      const order = await prisma.order.findUnique({
        where: { id: newOrder.id },
        include: {
          customer: true,
          orderItems: true,
          storage: true,
        },
      });

      // Enrich with actual items
      const enrichedOrders = await this.enrichOrdersWithItems([order!]);
      return enrichedOrders[0];
    }

    // Allocate storage and order number using the new system
    // Do everything in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create order first with a placeholder number
      const tempOrder = await tx.order.create({
        data: {
          type: data.type,
          customerId: data.customerId,
          paymentStatus: data.paymentStatus,
          paymentMethod: data.paymentMethod,
          status: data.status,
          total: total,
          totalPaid: data.totalPaid ?? 0,
          orderNumber: 0, // Temporary placeholder
          userId: userId,
          mainOrderId: data.mainOrderId,
          storageId: null, // Will be set after allocation
        },
      });

      // Allocate storage and order number within the same transaction
      const allocation =
        await storageService.allocateStorageAndOrderNumberInTransaction(
          tx,
          garmentCount,
          tempOrder.id
        );

      // Update order with correct order number and storage ID
      const updatedOrder = await tx.order.update({
        where: { id: tempOrder.id },
        data: {
          orderNumber: allocation.orderNumber,
          storageId: allocation.storageId,
        },
      });

      return updatedOrder;
    });

    // Create order items to link order with items
    await Promise.all(
      createdItemIds.map((itemId) =>
        prisma.orderItem.create({
          data: {
            type: data.type,
            orderId: result.id,
            itemId: itemId,
          },
        })
      )
    );

    // Return order with relations
    const order = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        orderItems: true,
        storage: true,
      },
    });

    // Enrich with actual items
    const enrichedOrders = await this.enrichOrdersWithItems([order!]);
    return enrichedOrders[0];
  }

  async getOrderById(id: string) {
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        orderItems: true,
        mainOrder: true,
        orderHistory: true,
      },
    });

    if (!order) {
      throw new OrderNotFoundError(id);
    }

    // Enrich with actual items
    const enrichedOrders = await this.enrichOrdersWithItems([order]);
    return enrichedOrders[0];
  }

  async getAllOrders() {
    // Get all orders
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        orderItems: true,
        storage: true,
        mainOrder: true,
        orderHistory: true,
        user: {
          omit: {
            password: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Enrich with actual items
    return await this.enrichOrdersWithItems(orders);
  }

  async getOrdersByCustomerId(customerId: string, orderStatus?: OrderStatus) {
    // Build where clause
    const where: { customerId: string; status?: OrderStatus } = {
      customerId,
    };

    // Add status filter if provided
    if (orderStatus) {
      where.status = orderStatus;
    }

    // Get all orders for a specific customer
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: true,
        storage: true,
        mainOrder: true,
        orderHistory: true,
        user: {
          omit: {
            password: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Enrich with actual items
    return await this.enrichOrdersWithItems(orders);
  }

  async updateOrder(id: string, data: UpdateOrderInput) {
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new OrderNotFoundError(id);
    }

    // For updates, we create a new order with the updated data and link it to the main order
    // This maintains order history
    if (data.type && data.type !== order.type) {
      throw new Error(
        "Cannot change order type. Please create a new order instead."
      );
    }

    const newStatus = data.status ?? order.status;
    const wasReleased = storageService.isOrderReleased(
      order.status as OrderStatus
    );
    const willBeReleased = storageService.isOrderReleased(
      newStatus as OrderStatus
    );

    // If order is being released (status changed to DELIVERED)
    if (!wasReleased && willBeReleased) {
      // Release the order (free capacity and order number)
      await storageService.releaseOrder(id);
    }

    // Update the existing order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        customerId: data.customerId ?? order.customerId,
        paymentStatus: data.paymentStatus ?? order.paymentStatus,
        paymentMethod: data.paymentMethod ?? order.paymentMethod,
        status: newStatus,
        total: data.total ?? order.total,
        totalPaid: data.totalPaid ?? order.totalPaid,
      },
      include: {
        customer: true,
        orderItems: true,
        storage: true,
      },
    });

    // Enrich with actual items
    const enrichedOrders = await this.enrichOrdersWithItems([updatedOrder]);
    return enrichedOrders[0];
  }

  async deleteOrder(id: string) {
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      throw new OrderNotFoundError(id);
    }

    // If order is not released, release it first (free capacity and order number)
    if (!storageService.isOrderReleased(order.status as OrderStatus)) {
      await storageService.releaseOrder(id).catch(() => {
        // If release fails, continue with deletion
      });
    }

    // Delete order items first
    await Promise.all(
      order.orderItems.map((orderItem) =>
        prisma.orderItem.delete({ where: { id: orderItem.id } })
      )
    );

    // Delete the items (ironing or cleaning) referenced by order items
    for (const orderItem of order.orderItems) {
      if (orderItem.type === OrderType.IRONING) {
        await prisma.ironingItem
          .delete({ where: { id: orderItem.itemId } })
          .catch(() => {
            // Item might already be deleted or not exist
          });
      } else if (orderItem.type === OrderType.CLEANING) {
        await prisma.cleaningItem
          .delete({ where: { id: orderItem.itemId } })
          .catch(() => {
            // Item might already be deleted or not exist
          });
      }
    }

    // Delete order
    await prisma.order.delete({ where: { id } });
  }
}

export const orderService = new OrderService();
