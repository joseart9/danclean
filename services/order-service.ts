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
   * Helper method to get the latest version of an order
   * Given an order ID, finds the original order and returns the latest version
   */
  private async getLatestOrderVersion(orderId: string) {
    // First, find the order to determine if it's the original or an update
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    // Determine the original order ID
    const originalOrderId = order.mainOrderId || order.id;

    // Find all orders that are part of this order's history
    // (original order + all updates)
    const allVersions = await prisma.order.findMany({
      where: {
        OR: [{ id: originalOrderId }, { mainOrderId: originalOrderId }],
      },
      include: {
        customer: true,
        orderItems: true,
        storage: true,
        mainOrder: true,
        orderHistory: {
          include: {
            user: {
              omit: {
                password: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
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

    // Return the latest version (first one after sorting by createdAt desc)
    return allVersions[0];
  }

  /**
   * Helper method to get the latest version of orders by order number
   * Returns only the latest version for each unique order number
   */
  private async getLatestOrderVersionsByOrderNumbers(orderNumbers: number[]) {
    if (orderNumbers.length === 0) return [];

    // Get all orders with these order numbers
    const allOrders = await prisma.order.findMany({
      where: {
        orderNumber: { in: orderNumbers },
      },
      include: {
        customer: true,
        orderItems: true,
        storage: true,
        mainOrder: true,
        orderHistory: {
          include: {
            user: {
              omit: {
                password: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        user: {
          omit: {
            password: true,
          },
        },
      },
    });

    // For each order number, find the original order (mainOrderId = null)
    // Then find all versions (original + updates) and get the latest
    const latestVersions: typeof allOrders = [];

    for (const orderNumber of orderNumbers) {
      // Find the original order for this order number
      const originalOrder = allOrders.find(
        (o) => o.orderNumber === orderNumber && o.mainOrderId === null
      );

      if (!originalOrder) {
        // If no original found, skip this order number
        continue;
      }

      // Find all versions of this order (original + all updates)
      const allVersions = allOrders.filter(
        (o) =>
          o.orderNumber === orderNumber &&
          (o.id === originalOrder.id || o.mainOrderId === originalOrder.id)
      );

      // Get the latest version (highest createdAt)
      const latestVersion = allVersions.reduce((latest, current) => {
        return current.createdAt > latest.createdAt ? current : latest;
      });

      latestVersions.push(latestVersion);
    }

    return latestVersions;
  }

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
          isMainOrder: !data.mainOrderId, // Main order only if no mainOrderId
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
          isMainOrder: !data.mainOrderId, // Main order only if no mainOrderId
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
    // First, find the order to determine if it's the main order or an update
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new OrderNotFoundError(id);
    }

    // Determine the original order ID (the one that all updates point to)
    const originalOrderId = order.mainOrderId || order.id;

    // Find the main order (isMainOrder = true) for this order's history
    const mainOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { id: originalOrderId, isMainOrder: true },
          { mainOrderId: originalOrderId, isMainOrder: true },
        ],
      },
      include: {
        customer: true,
        orderItems: true,
        storage: true,
        mainOrder: true,
        user: {
          omit: {
            password: true,
          },
        },
      },
    });

    if (!mainOrder) {
      throw new OrderNotFoundError(id);
    }

    // Fetch ALL orders in the history chain (original + all updates)
    // This includes all orders where mainOrderId = originalOrderId OR id = originalOrderId
    const allHistoryOrders = await prisma.order.findMany({
      where: {
        OR: [{ id: originalOrderId }, { mainOrderId: originalOrderId }],
      },
      include: {
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

    // Filter out the main order from history (we already have it)
    const orderHistory = allHistoryOrders.filter((h) => h.id !== mainOrder.id);

    // Attach the history to the main order
    const mainOrderWithHistory = {
      ...mainOrder,
      orderHistory,
    };

    // Enrich with actual items
    const enrichedOrders = await this.enrichOrdersWithItems([
      mainOrderWithHistory,
    ]);
    return enrichedOrders[0];
  }

  async getAllOrders(includeDelivered: boolean = false) {
    // Get all main orders (isMainOrder = true)
    const where: {
      isMainOrder: boolean;
      status?: { not: OrderStatus };
    } = {
      isMainOrder: true,
    };

    if (!includeDelivered) {
      where.status = { not: OrderStatus.DELIVERED };
    }

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

  async getOrdersByCustomerId(
    customerId: string,
    orderStatus?: OrderStatus,
    excludeDelivered: boolean = false
  ) {
    // Build where clause
    const where: {
      customerId: string;
      isMainOrder: boolean;
      status?: OrderStatus | { not: OrderStatus };
    } = {
      customerId,
      isMainOrder: true,
    };

    // Apply status filters
    if (excludeDelivered) {
      where.status = { not: OrderStatus.DELIVERED };
    } else if (orderStatus) {
      where.status = orderStatus;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: true,
        storage: true,
        mainOrder: true,
        orderHistory: {
          include: {
            user: {
              omit: {
                password: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
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

  async getOrderByOrderNumber(
    orderNumber: number,
    excludeDelivered: boolean = true
  ) {
    // Get the main order (isMainOrder = true) for this order number
    const where: {
      orderNumber: number;
      isMainOrder: boolean;
      status?: { not: OrderStatus };
    } = {
      orderNumber,
      isMainOrder: true,
    };

    if (excludeDelivered) {
      where.status = { not: OrderStatus.DELIVERED };
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        customer: true,
        orderItems: true,
        storage: true,
        mainOrder: true,
        orderHistory: {
          include: {
            user: {
              omit: {
                password: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        user: {
          omit: {
            password: true,
          },
        },
      },
    });

    if (!order) {
      throw new OrderNotFoundError(`número de orden ${orderNumber}`);
    }

    // Enrich with actual items
    const enrichedOrders = await this.enrichOrdersWithItems([order]);
    return enrichedOrders[0];
  }

  async updateOrder(id: string, data: UpdateOrderInput) {
    // Get the latest version of the order
    const latestOrder = await this.getLatestOrderVersion(id);

    // For updates, we create a new order with the updated data and link it to the main order
    // This maintains order history
    if (data.type && data.type !== latestOrder.type) {
      throw new Error(
        "Cannot change order type. Please create a new order instead."
      );
    }

    // Determine the original order ID (the one without mainOrderId)
    const originalOrderId = latestOrder.mainOrderId || latestOrder.id;

    // Get the original order to get its orderItems
    const originalOrder = await prisma.order.findUnique({
      where: { id: originalOrderId },
      include: {
        orderItems: true,
      },
    });

    if (!originalOrder) {
      throw new OrderNotFoundError(originalOrderId);
    }

    const newStatus = data.status ?? latestOrder.status;
    const wasReleased = storageService.isOrderReleased(
      latestOrder.status as OrderStatus
    );
    const willBeReleased = storageService.isOrderReleased(
      newStatus as OrderStatus
    );

    // If order is being released (status changed to DELIVERED)
    if (!wasReleased && willBeReleased) {
      // Release the order (free capacity and order number)
      // Use the original order ID for release
      await storageService.releaseOrder(originalOrderId);
    }

    // Get user ID for the new order
    const userId = await getUserId();
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Set the old main order's isMainOrder to false
    await prisma.order.updateMany({
      where: {
        OR: [
          { id: originalOrderId, isMainOrder: true },
          { mainOrderId: originalOrderId, isMainOrder: true },
        ],
      },
      data: {
        isMainOrder: false,
      },
    });

    // Create a new order record with updated data
    // Keep the same orderNumber, total, and items
    const newOrder = await prisma.order.create({
      data: {
        type: latestOrder.type,
        customerId: data.customerId ?? latestOrder.customerId,
        paymentStatus: data.paymentStatus ?? latestOrder.paymentStatus,
        paymentMethod: data.paymentMethod ?? latestOrder.paymentMethod,
        status: newStatus,
        total: latestOrder.total, // Keep the same total
        totalPaid: data.totalPaid ?? latestOrder.totalPaid,
        orderNumber: latestOrder.orderNumber, // Keep the same order number
        storageId: latestOrder.storageId, // Keep the same storage
        mainOrderId: originalOrderId, // Link to the original order
        isMainOrder: true, // This is now the main order
        userId: userId,
      },
    });

    // Link the existing orderItems to the new order (don't create new items)
    await Promise.all(
      originalOrder.orderItems.map((orderItem) =>
        prisma.orderItem.create({
          data: {
            type: orderItem.type,
            orderId: newOrder.id,
            itemId: orderItem.itemId, // Use the same item IDs
          },
        })
      )
    );

    // Return the new order with relations
    const updatedOrder = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: {
        customer: true,
        orderItems: true,
        storage: true,
        mainOrder: true,
        orderHistory: {
          include: {
            user: {
              omit: {
                password: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        user: {
          omit: {
            password: true,
          },
        },
      },
    });

    // Enrich with actual items
    const enrichedOrders = await this.enrichOrdersWithItems([updatedOrder!]);
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
