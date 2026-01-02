// DB
import { prisma } from "@/db";

// Types
import { OrderStatus } from "@/types/order";

export class StorageService {
  /**
   * Finds a storage with enough remaining capacity for the given garment count
   * @param garmentCount - Number of garments to store
   * @returns Storage with enough capacity, or null if none found
   */
  async findAvailableStorage(garmentCount: number) {
    // Get all storages and check capacity in code
    // This is necessary because Prisma doesn't support computed fields in where clauses
    const storages = await prisma.storage.findMany({
      orderBy: {
        usedCapacity: "asc", // Prefer storages with less usage
      },
    });

    // Find first storage with enough capacity
    for (const storage of storages) {
      if (storage.usedCapacity + garmentCount <= storage.totalCapacity) {
        return storage;
      }
    }

    return null;
  }

  /**
   * Finds an available order number within a storage's range that is not currently active
   * @param storageId - Storage ID
   * @param fromNumberRange - Start of number range
   * @param toNumberRange - End of number range
   * @returns Available order number, or null if none found
   */
  async findAvailableOrderNumber(
    storageId: string,
    fromNumberRange: number,
    toNumberRange: number
  ) {
    // Get all currently active order numbers for this storage
    const activeNumbers = await prisma.activeOrderNumber.findMany({
      where: {
        storageId,
        orderNumber: {
          gte: fromNumberRange,
          lte: toNumberRange,
        },
      },
      select: {
        orderNumber: true,
      },
    });

    const activeNumberSet = new Set(
      activeNumbers.map((n: { orderNumber: number }) => n.orderNumber)
    );

    // Find the first available number in the range
    for (let num = fromNumberRange; num <= toNumberRange; num++) {
      if (!activeNumberSet.has(num)) {
        return num;
      }
    }

    return null;
  }

  /**
   * Allocates a storage and order number for a new order (internal, works with transaction)
   * @param tx - Prisma transaction client
   * @param garmentCount - Number of garments in the order
   * @param orderId - Order ID to link the allocation
   * @returns Object with storageId and orderNumber, or throws error if allocation fails
   */
  private async allocateStorageAndOrderNumberInternal(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any, // Prisma transaction client - type will be available after prisma generate
    garmentCount: number,
    orderId: string
  ) {
    // Find available storage with enough capacity
    const storages = await tx.storage.findMany({
      orderBy: {
        usedCapacity: "asc",
      },
    });

    // Find first storage with enough capacity
    let storage = null;
    for (const s of storages) {
      if (s.usedCapacity + garmentCount <= s.totalCapacity) {
        storage = s;
        break;
      }
    }

    if (!storage) {
      throw new Error(
        "No storage available with enough capacity for this order"
      );
    }

    // Find available order number in storage's range
    const activeNumbers = await tx.activeOrderNumber.findMany({
      where: {
        storageId: storage.id,
        orderNumber: {
          gte: storage.fromNumberRange,
          lte: storage.toNumberRange,
        },
      },
      select: {
        orderNumber: true,
      },
    });

    const activeNumberSet = new Set(
      activeNumbers.map((n: { orderNumber: number }) => n.orderNumber)
    );

    let orderNumber: number | null = null;
    for (
      let num = storage.fromNumberRange;
      num <= storage.toNumberRange;
      num++
    ) {
      if (!activeNumberSet.has(num)) {
        orderNumber = num;
        break;
      }
    }

    if (!orderNumber) {
      throw new Error(
        `No available order numbers in storage ${storage.storageNumber}'s range`
      );
    }

    // Update storage capacity atomically
    await tx.storage.update({
      where: { id: storage.id },
      data: {
        usedCapacity: {
          increment: garmentCount,
        },
      },
    });

    // Create active order number allocation
    await tx.activeOrderNumber.create({
      data: {
        orderNumber,
        orderId,
        storageId: storage.id,
      },
    });

    return {
      storageId: storage.id,
      orderNumber,
    };
  }

  /**
   * Allocates a storage and order number for a new order
   * Uses a transaction to ensure atomicity and prevent race conditions
   * @param garmentCount - Number of garments in the order
   * @param orderId - Order ID to link the allocation
   * @returns Object with storageId and orderNumber, or throws error if allocation fails
   */
  async allocateStorageAndOrderNumber(garmentCount: number, orderId: string) {
    return await prisma.$transaction(async (tx) => {
      return await this.allocateStorageAndOrderNumberInternal(
        tx,
        garmentCount,
        orderId
      );
    });
  }

  /**
   * Allocates a storage and order number within an existing transaction
   * @param tx - Prisma transaction client
   * @param garmentCount - Number of garments in the order
   * @param orderId - Order ID to link the allocation
   * @returns Object with storageId and orderNumber, or throws error if allocation fails
   */
  async allocateStorageAndOrderNumberInTransaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any, // Prisma transaction client - type will be available after prisma generate
    garmentCount: number,
    orderId: string
  ) {
    return await this.allocateStorageAndOrderNumberInternal(
      tx,
      garmentCount,
      orderId
    );
  }

  /**
   * Releases an order (frees capacity and order number)
   * Called when an order status changes to DELIVERED
   * @param orderId - Order ID to release
   */
  async releaseOrder(orderId: string) {
    return await prisma.$transaction(async (tx) => {
      // Get the order with its items to calculate garment count
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: true,
        },
      });

      if (!order || !order.storageId) {
        // Order doesn't have storage allocated, nothing to release
        return;
      }

      // Get active order number allocation
      const activeAllocation = await tx.activeOrderNumber.findUnique({
        where: { orderId },
      });

      if (!activeAllocation) {
        // Already released or never allocated
        return;
      }

      // Calculate garment count from order items
      let garmentCount = 0;
      if (order.type === "IRONING") {
        // Get ironing item quantity
        const ironingItem = await tx.ironingItem.findFirst({
          where: {
            id: {
              in: order.orderItems.map((oi) => oi.itemId),
            },
          },
        });
        if (ironingItem) {
          garmentCount = ironingItem.quantity;
        }
      } else if (order.type === "CLEANING") {
        // Sum all cleaning item quantities
        const cleaningItems = await tx.cleaningItem.findMany({
          where: {
            id: {
              in: order.orderItems.map((oi) => oi.itemId),
            },
          },
        });
        garmentCount = cleaningItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
      }

      // Decrease storage capacity
      await tx.storage.update({
        where: { id: order.storageId },
        data: {
          usedCapacity: {
            decrement: garmentCount,
          },
        },
      });

      // Delete active order number allocation
      await tx.activeOrderNumber.delete({
        where: { id: activeAllocation.id },
      });
    });
  }

  /**
   * Checks if an order is released (status is DELIVERED)
   * @param status - Order status
   * @returns True if order is released
   */
  isOrderReleased(status: OrderStatus): boolean {
    return status === OrderStatus.DELIVERED;
  }
}

export const storageService = new StorageService();
