// DB
import { prisma } from "@/db";

// Errors
import { OrderItemNotFoundError } from "@/errors";

// Validators
import {
  CreateOrderItemInput,
  UpdateOrderItemInput,
} from "@/validators/order-item";

export class OrderItemService {
  async createOrderItem(data: CreateOrderItemInput) {
    // Create order item
    const newOrderItem = await prisma.orderItem.create({
      data: {
        type: data.type,
        orderId: data.orderId,
        itemId: data.itemId,
      },
    });

    return newOrderItem;
  }

  async getOrderItemById(id: string) {
    // Check if order item exists
    const orderItem = await prisma.orderItem.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!orderItem) {
      throw new OrderItemNotFoundError(id);
    }

    // Return order item
    return orderItem;
  }

  async getAllOrderItems() {
    // Get all order items
    const orderItems = await prisma.orderItem.findMany({
      include: {
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orderItems;
  }

  async getOrderItemsByOrderId(orderId: string) {
    // Get all order items for a specific order
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      include: {
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orderItems;
  }

  async updateOrderItem(id: string, data: UpdateOrderItemInput) {
    // Check if order item exists
    const orderItem = await prisma.orderItem.findUnique({
      where: { id },
    });

    if (!orderItem) {
      throw new OrderItemNotFoundError(id);
    }

    // Update order item
    const updatedOrderItem = await prisma.orderItem.update({
      where: { id },
      data,
    });

    // Return order item
    return updatedOrderItem;
  }

  async deleteOrderItem(id: string) {
    // Check if order item exists
    const orderItem = await prisma.orderItem.findUnique({
      where: { id },
    });

    if (!orderItem) {
      throw new OrderItemNotFoundError(id);
    }

    // Delete order item
    await prisma.orderItem.delete({ where: { id } });
  }
}

export const orderItemService = new OrderItemService();
